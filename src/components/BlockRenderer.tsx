import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Block, BlockWidth } from "@/lib/blocks";
// three.js + drei yalnızca sayfada gerçekten 3D bloğu varsa indirilsin diye
// tembel yükleyen bir client sarmalayıcı üzerinden geliyor.
import ModelViewer from "./ModelViewerLazy";

/**
 * Blokları sayfaya basar. Genişlik sınıfları, admin'in panelden seçtiği
 * "sayfadaki düzen" ayarının karşılığı: normal okuma genişliği, geniş
 * (metnin dışına taşan) ve tam genişlik.
 */
const WIDTH_CLASS: Record<BlockWidth, string> = {
  normal: "mx-auto max-w-3xl",
  wide: "mx-auto max-w-5xl",
  full: "mx-auto max-w-7xl",
};

function Figure({
  caption,
  width,
  children,
}: {
  caption?: string;
  width: BlockWidth;
  children: React.ReactNode;
}) {
  return (
    <figure className={`${WIDTH_CLASS[width]} px-6`}>
      {children}
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted">{caption}</figcaption>
      )}
    </figure>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "tldr":
      return (
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-light">
              Kısaca
            </p>
            <p className="text-lg leading-relaxed text-white">{block.text}</p>
          </div>
        </div>
      );

    case "table":
      return (
        <div className="mx-auto max-w-5xl px-6">
          {/* Tablo kendi içinde kayar; sayfanın yatay kaymasına izin verilmiyor. */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 bg-white/5">
                  {block.headers.map((header, i) => (
                    <th key={i} scope="col" className="px-5 py-3 font-semibold text-white">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={j === 0 ? "px-5 py-3 font-medium text-white" : "px-5 py-3 text-muted"}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && (
            <p className="mt-3 text-center text-sm text-muted">{block.caption}</p>
          )}
        </div>
      );

    case "faq":
      return (
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-3">
            {block.items.map((item, i) => (
              // <details> yerine her zaman açık: GEO rehberi "tam render
              // edilmiş FAQ" istiyor — gizli metin alıntılanmıyor.
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-heading text-base font-semibold text-white">
                  {item.question}
                </h3>
                <div className="prose-lupra mt-2 text-sm">
                  <ReactMarkdown>{item.answer}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "text":
      return (
        <div className="mx-auto max-w-3xl px-6">
          <div className="prose-lupra">
            <ReactMarkdown>{block.markdown}</ReactMarkdown>
          </div>
        </div>
      );

    case "image":
      return (
        <Figure caption={block.caption} width={block.width}>
          {/* eslint-disable-next-line @next/next/no-img-element -- görseller
              Supabase Storage'dan geliyor; next/image için her ortamın
              remotePatterns yapılandırması gerekir. loading="lazy" ve
              boyutlandırma zaten burada. */}
          <img
            src={block.url}
            alt={block.alt}
            loading="lazy"
            className="w-full rounded-2xl border border-white/10"
          />
        </Figure>
      );

    case "gallery":
      return (
        <div className="mx-auto max-w-5xl px-6">
          <div
            className={`grid gap-4 ${
              block.columns === 3 ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            {block.items.map((item, i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element -- yukarıdaki gerekçe */}
                <img
                  src={item.url}
                  alt={item.alt}
                  loading="lazy"
                  className="aspect-4/3 w-full rounded-xl border border-white/10 object-cover"
                />
                {item.caption && (
                  <figcaption className="mt-2 text-xs text-muted">{item.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      );

    case "video":
      return (
        <Figure caption={block.caption} width={block.width}>
          <video
            src={block.url}
            controls
            playsInline
            preload="metadata"
            // Otomatik oynatma yalnızca sessiz+döngü olarak; tarayıcılar sesli
            // otomatik oynatmayı zaten engelliyor.
            autoPlay={block.autoplay}
            muted={block.autoplay}
            loop={block.autoplay}
            className="w-full rounded-2xl border border-white/10 bg-black"
          />
        </Figure>
      );

    case "model3d":
      return (
        <Figure caption={block.caption} width={block.width}>
          <ModelViewer
            url={block.url}
            autoRotate={block.autoRotate}
            tall={block.height === "tall"}
          />
        </Figure>
      );

    case "quote":
      return (
        <div className="mx-auto max-w-3xl px-6">
          <blockquote className="border-l-4 border-accent pl-6">
            <p className="font-heading text-xl leading-relaxed text-white md:text-2xl">
              “{block.text}”
            </p>
            {block.author && <footer className="mt-4 text-sm text-muted">— {block.author}</footer>}
          </blockquote>
        </div>
      );

    case "features":
      return (
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {block.items.map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                {item.title && (
                  <h3 className="font-heading text-base font-semibold text-white">{item.title}</h3>
                )}
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "cta": {
      const external = block.href.startsWith("http");
      const className =
        "inline-block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90";
      return (
        <div className="mx-auto max-w-3xl px-6 text-center">
          {external ? (
            <a href={block.href} target="_blank" rel="noreferrer" className={className}>
              {block.label}
            </a>
          ) : (
            <Link href={block.href} className={className}>
              {block.label}
            </Link>
          )}
          {block.note && <p className="mt-3 text-xs text-muted">{block.note}</p>}
        </div>
      );
    }
  }
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-14 md:space-y-20">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}
