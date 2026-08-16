/**
 * Proje sayfalarının blok tabanlı içerik modeli.
 *
 * Sayfa sıralı bloklardan oluşur; dizideki sıra sayfadaki sıradır. Bloklar
 * JSONB olarak `projects.blocks` kolonunda saklanır, yani yeni blok tipleri
 * migration gerektirmez.
 *
 * parseBlocks() GÜVENLİK SINIRIDIR: editör bloğu tarayıcıda JSON'a çevirip
 * gönderiyor, dolayısıyla gelen veri tamamen istemci kontrolünde. Burada
 * beyaz liste mantığıyla yeniden inşa ediliyor — tanınmayan alanlar düşer,
 * uzunluklar kırpılır, URL şeması doğrulanır.
 */

export const BLOCK_TYPES = [
  "tldr",
  "text",
  "table",
  "faq",
  "image",
  "gallery",
  "video",
  "model3d",
  "quote",
  "features",
  "cta",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

/** Blok genişliği — kullanıcının sayfa düzenini ayarladığı ana kontrol. */
export type BlockWidth = "normal" | "wide" | "full";

export const BLOCK_LABELS: Record<BlockType, string> = {
  tldr: "Özet (TL;DR)",
  table: "Karşılaştırma tablosu",
  faq: "Sıkça sorulanlar",
  text: "Metin",
  image: "Görsel",
  gallery: "Galeri",
  video: "Video",
  model3d: "3D Model",
  quote: "Alıntı",
  features: "Özellik listesi",
  cta: "Buton (CTA)",
};

export const BLOCK_ICONS: Record<BlockType, string> = {
  tldr: "⚡",
  table: "📊",
  faq: "❓",
  text: "📝",
  image: "🖼️",
  gallery: "🎞️",
  video: "🎬",
  model3d: "🧊",
  quote: "💬",
  features: "✅",
  cta: "🔗",
};

export type MediaItem = { url: string; alt: string; caption: string };

export type FaqItem = { question: string; answer: string };

export type Block =
  /**
   * Answer-first özet. Yazının ilk 40-60 kelimesinin doğrudan cevabı vermesi
   * gerekiyor (GEO rehberi 5.1/2) — LLM'ler pasajı bağlamdan kopuk okuduğu
   * için "giriş yaparak ısınan" metin alıntılanmıyor.
   */
  | { id: string; type: "tldr"; text: string }
  /**
   * Karşılaştırma tablosu. Tablo + yapılandırılmış veri içeren içerik,
   * yapılandırılmamışa göre 2.5 kat daha fazla alıntılanıyor (GEO 5.3).
   */
  | { id: string; type: "table"; caption: string; headers: string[]; rows: string[][] }
  /** Tam render edilen FAQ; sayfaya FAQPage JSON-LD'si de bundan üretiliyor. */
  | { id: string; type: "faq"; items: FaqItem[] }
  | { id: string; type: "text"; markdown: string }
  | { id: string; type: "image"; url: string; alt: string; caption: string; width: BlockWidth }
  | { id: string; type: "gallery"; items: MediaItem[]; columns: 2 | 3 }
  | { id: string; type: "video"; url: string; caption: string; width: BlockWidth; autoplay: boolean }
  | {
      id: string;
      type: "model3d";
      url: string;
      caption: string;
      width: BlockWidth;
      height: "short" | "tall";
      autoRotate: boolean;
    }
  | { id: string; type: "quote"; text: string; author: string }
  | { id: string; type: "features"; items: { title: string; description: string }[] }
  | { id: string; type: "cta"; label: string; href: string; note: string };

export const MAX_BLOCKS = 60;
const MAX_MARKDOWN = 20_000;
const MAX_SHORT_TEXT = 300;
const MAX_URL = 1_000;
const MAX_LIST_ITEMS = 16;
const MAX_TABLE_COLS = 6;
const MAX_TABLE_ROWS = 30;

const WIDTHS: BlockWidth[] = ["normal", "wide", "full"];

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function width(value: unknown): BlockWidth {
  return WIDTHS.includes(value as BlockWidth) ? (value as BlockWidth) : "normal";
}

/**
 * Medya URL'i: yalnızca http(s) kabul edilir. `javascript:` ve `data:`
 * şemaları burada elenir — bloklar admin tarafından yazılsa bile, biçimi
 * doğrulanmamış bir URL'i sayfaya basmak istemiyoruz.
 */
function mediaUrl(value: unknown): string {
  const raw = str(value, MAX_URL).trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? raw : "";
  } catch {
    return "";
  }
}

/** Bağlantı hedefi: https URL'i veya site içi göreli yol. */
function linkUrl(value: unknown): string {
  const raw = str(value, MAX_URL).trim();
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  if (raw.startsWith("#")) return raw;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" ? raw : "";
  } catch {
    return "";
  }
}

function mediaItems(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_LIST_ITEMS)
    .map((item) => {
      const record = (item ?? {}) as Record<string, unknown>;
      return {
        url: mediaUrl(record.url),
        alt: str(record.alt, MAX_SHORT_TEXT),
        caption: str(record.caption, MAX_SHORT_TEXT),
      };
    })
    .filter((item) => item.url);
}

let idCounter = 0;
export function newBlockId(): string {
  idCounter += 1;
  return `b${Date.now().toString(36)}${idCounter.toString(36)}`;
}

/** Yeni eklenen bloğun boş hâli. */
export function emptyBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "tldr":
      return { id, type, text: "" };
    case "table":
      return { id, type, caption: "", headers: ["", ""], rows: [["", ""]] };
    case "faq":
      return { id, type, items: [{ question: "", answer: "" }] };
    case "text":
      return { id, type, markdown: "" };
    case "image":
      return { id, type, url: "", alt: "", caption: "", width: "normal" };
    case "gallery":
      return { id, type, items: [], columns: 2 };
    case "video":
      return { id, type, url: "", caption: "", width: "wide", autoplay: false };
    case "model3d":
      return { id, type, url: "", caption: "", width: "wide", height: "tall", autoRotate: true };
    case "quote":
      return { id, type, text: "", author: "" };
    case "features":
      return { id, type, items: [{ title: "", description: "" }] };
    case "cta":
      return { id, type, label: "", href: "", note: "" };
  }
}

/** Blok gövdesi boş mu? Boş bloklar kaydedilirken atılır. */
function isEmpty(block: Block): boolean {
  switch (block.type) {
    case "tldr":
      return !block.text.trim();
    case "table":
      return (
        block.headers.every((h) => !h.trim()) &&
        block.rows.every((r) => r.every((c) => !c.trim()))
      );
    case "faq":
      return block.items.every((i) => !i.question.trim() && !i.answer.trim());
    case "text":
      return !block.markdown.trim();
    case "image":
    case "video":
    case "model3d":
      return !block.url;
    case "gallery":
      return block.items.length === 0;
    case "quote":
      return !block.text.trim();
    case "features":
      return block.items.every((item) => !item.title.trim() && !item.description.trim());
    case "cta":
      return !block.label.trim() || !block.href;
  }
}

function parseOne(raw: unknown): Block | null {
  const record = (raw ?? {}) as Record<string, unknown>;
  const type = record.type;
  if (!BLOCK_TYPES.includes(type as BlockType)) return null;

  const id = str(record.id, 64) || newBlockId();

  switch (type as BlockType) {
    case "tldr":
      return { id, type: "tldr", text: str(record.text, MAX_SHORT_TEXT * 4) };

    case "table": {
      const headers = (Array.isArray(record.headers) ? record.headers : [])
        .slice(0, MAX_TABLE_COLS)
        .map((h) => str(h, MAX_SHORT_TEXT));
      // Her satır başlık sayısına sabitleniyor: eksik hücreler boşla
      // tamamlanıyor, fazlası atılıyor. Aksi hâlde bozuk bir JSON düzensiz
      // sütunlu bir tablo üretebilirdi.
      const rows = (Array.isArray(record.rows) ? record.rows : [])
        .slice(0, MAX_TABLE_ROWS)
        .map((row) => {
          const cells = Array.isArray(row) ? row : [];
          return Array.from({ length: headers.length }, (_, i) =>
            str(cells[i], MAX_SHORT_TEXT)
          );
        });
      return { id, type: "table", caption: str(record.caption, MAX_SHORT_TEXT), headers, rows };
    }

    case "faq":
      return {
        id,
        type: "faq",
        items: (Array.isArray(record.items) ? record.items : [])
          .slice(0, MAX_LIST_ITEMS)
          .map((item) => {
            const entry = (item ?? {}) as Record<string, unknown>;
            return {
              question: str(entry.question, MAX_SHORT_TEXT),
              answer: str(entry.answer, MAX_MARKDOWN),
            };
          })
          .filter((i) => i.question || i.answer),
      };

    case "text":
      return { id, type: "text", markdown: str(record.markdown, MAX_MARKDOWN) };

    case "image":
      return {
        id,
        type: "image",
        url: mediaUrl(record.url),
        alt: str(record.alt, MAX_SHORT_TEXT),
        caption: str(record.caption, MAX_SHORT_TEXT),
        width: width(record.width),
      };

    case "gallery":
      return {
        id,
        type: "gallery",
        items: mediaItems(record.items),
        columns: record.columns === 3 ? 3 : 2,
      };

    case "video":
      return {
        id,
        type: "video",
        url: mediaUrl(record.url),
        caption: str(record.caption, MAX_SHORT_TEXT),
        width: width(record.width),
        autoplay: record.autoplay === true,
      };

    case "model3d":
      return {
        id,
        type: "model3d",
        url: mediaUrl(record.url),
        caption: str(record.caption, MAX_SHORT_TEXT),
        width: width(record.width),
        height: record.height === "short" ? "short" : "tall",
        autoRotate: record.autoRotate !== false,
      };

    case "quote":
      return {
        id,
        type: "quote",
        text: str(record.text, MAX_MARKDOWN),
        author: str(record.author, MAX_SHORT_TEXT),
      };

    case "features":
      return {
        id,
        type: "features",
        items: (Array.isArray(record.items) ? record.items : [])
          .slice(0, MAX_LIST_ITEMS)
          .map((item) => {
            const entry = (item ?? {}) as Record<string, unknown>;
            return {
              title: str(entry.title, MAX_SHORT_TEXT),
              description: str(entry.description, MAX_SHORT_TEXT * 2),
            };
          })
          .filter((item) => item.title || item.description),
      };

    case "cta":
      return {
        id,
        type: "cta",
        label: str(record.label, MAX_SHORT_TEXT),
        href: linkUrl(record.href),
        note: str(record.note, MAX_SHORT_TEXT),
      };
  }
}

/**
 * Bilinmeyen girdiden güvenli bir blok dizisi üretir. Hata fırlatmaz:
 * tanınmayan/bozuk bloklar sessizce düşer, kalanlar normalize edilir.
 */
export function parseBlocks(input: unknown): Block[] {
  let raw: unknown = input;

  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .slice(0, MAX_BLOCKS)
    .map(parseOne)
    .filter((block): block is Block => block !== null && !isEmpty(block));
}

/** Yazıdaki tüm FAQ maddeleri — FAQPage JSON-LD'si buradan üretiliyor. */
export function collectFaqItems(blocks: Block[]): FaqItem[] {
  return blocks
    .filter((b): b is Extract<Block, { type: "faq" }> => b.type === "faq")
    .flatMap((b) => b.items)
    .filter((i) => i.question.trim() && i.answer.trim());
}

/**
 * Kaba okuma süresi. Türkçe için dakikada ~200 kelime; tablo ve SSS
 * içerikleri de sayıya dahil çünkü okunuyorlar.
 */
export function readingMinutes(blocks: Block[]): number {
  let words = 0;
  for (const block of blocks) {
    const text =
      block.type === "text"
        ? block.markdown
        : block.type === "tldr"
          ? block.text
          : block.type === "quote"
            ? block.text
            : block.type === "faq"
              ? block.items.map((i) => `${i.question} ${i.answer}`).join(" ")
              : block.type === "table"
                ? [...block.headers, ...block.rows.flat()].join(" ")
                : block.type === "features"
                  ? block.items.map((i) => `${i.title} ${i.description}`).join(" ")
                  : "";
    words += text.split(/\s+/).filter(Boolean).length;
  }
  return Math.max(1, Math.round(words / 200));
}

/** Blokların düz metin özeti — SEO açıklaması boşsa kullanılır. */
export function blocksToPlainText(blocks: Block[], maxLength = 200): string {
  for (const block of blocks) {
    const text =
      block.type === "tldr"
        ? block.text
        : block.type === "text"
          ? block.markdown
          : block.type === "quote"
            ? block.text
            : "";
    const clean = text
      .replace(/[#*_>`[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (clean) {
      return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
    }
  }
  return "";
}
