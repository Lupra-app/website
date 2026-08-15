"use client";

import { useState } from "react";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  BLOCK_TYPES,
  MAX_BLOCKS,
  emptyBlock,
  newBlockId,
  type Block,
  type BlockType,
  type BlockWidth,
} from "@/lib/blocks";
import { MediaUploader } from "./MediaUploader";

/**
 * Blok tabanlı sayfa editörü.
 *
 * Blok dizisi burada state olarak tutulur ve gizli bir input'a JSON olarak
 * yazılır — böylece mevcut useActionState formuyla tek gönderimde kaydedilir.
 * Sunucu tarafında parseBlocks() bu JSON'u yeniden doğruluyor; buradaki
 * hiçbir şey güvenlik sınırı değil.
 */
export function BlockEditor({ name, initial }: { name: string; initial: Block[] }) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [picker, setPicker] = useState(false);

  const update = (id: string, patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));

  const remove = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));

  const move = (index: number, delta: number) =>
    setBlocks((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const add = (type: BlockType) => {
    setBlocks((prev) => (prev.length >= MAX_BLOCKS ? prev : [...prev, emptyBlock(type)]));
    setPicker(false);
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">
          Sayfa içeriği{" "}
          <span className="text-muted/60">
            — {blocks.length} blok, sıralarını okla değiştirebilirsin
          </span>
        </span>
      </div>

      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-muted">
          Henüz blok yok. Aşağıdan ekleyerek sayfayı kurmaya başla.
        </p>
      )}

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-xl border border-white/12 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <span aria-hidden="true">{BLOCK_ICONS[block.type]}</span>
                {BLOCK_LABELS[block.type]}
                <span className="text-xs font-normal text-muted/50">#{index + 1}</span>
              </span>

              <div className="flex items-center gap-1">
                <IconButton
                  label="Yukarı taşı"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </IconButton>
                <IconButton
                  label="Aşağı taşı"
                  disabled={index === blocks.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </IconButton>
                <IconButton label="Bloğu sil" danger onClick={() => remove(block.id)}>
                  ✕
                </IconButton>
              </div>
            </div>

            <BlockFields block={block} onChange={(patch) => update(block.id, patch)} />
          </div>
        ))}
      </div>

      <div className="mt-4">
        {picker ? (
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Ne eklemek istiyorsun?</span>
              <button
                type="button"
                onClick={() => setPicker(false)}
                className="text-xs text-muted hover:text-white"
              >
                Vazgeç
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-muted transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-white"
                >
                  <span aria-hidden="true" className="text-lg">
                    {BLOCK_ICONS[type]}
                  </span>
                  {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicker(true)}
            disabled={blocks.length >= MAX_BLOCKS}
            className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {blocks.length >= MAX_BLOCKS ? `En fazla ${MAX_BLOCKS} blok` : "+ Blok ekle"}
          </button>
        )}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-lg border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          : "border-white/15 bg-white/5 text-muted hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-muted/40 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

const WIDTH_LABELS: Record<BlockWidth, string> = {
  normal: "Normal",
  wide: "Geniş",
  full: "Tam genişlik",
};

function WidthPicker({
  value,
  onChange,
}: {
  value: BlockWidth;
  onChange: (w: BlockWidth) => void;
}) {
  return (
    <Field label="Sayfadaki genişliği">
      <div className="flex gap-2">
        {(Object.keys(WIDTH_LABELS) as BlockWidth[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              value === w
                ? "border-accent/40 bg-accent/15 text-white"
                : "border-white/10 bg-white/5 text-muted hover:text-white"
            }`}
          >
            {WIDTH_LABELS[w]}
          </button>
        ))}
      </div>
    </Field>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
}) {
  switch (block.type) {
    case "text":
      return (
        <Field label="Metin (markdown)">
          <textarea
            rows={8}
            value={block.markdown}
            onChange={(e) => onChange({ markdown: e.target.value } as Partial<Block>)}
            placeholder={"## Başlık\n\nParagraf metni...\n\n- Madde\n- Madde"}
            className={`${inputClass} resize-y font-mono leading-relaxed`}
          />
        </Field>
      );

    case "image":
      return (
        <div className="space-y-4">
          <MediaUploader
            kind="image"
            value={block.url}
            onChange={(url) => onChange({ url } as Partial<Block>)}
            label="Görsel"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alternatif metin (erişilebilirlik ve SEO)">
              <input
                value={block.alt}
                onChange={(e) => onChange({ alt: e.target.value } as Partial<Block>)}
                placeholder="Görselde ne var?"
                className={inputClass}
              />
            </Field>
            <Field label="Alt yazı (opsiyonel)">
              <input
                value={block.caption}
                onChange={(e) => onChange({ caption: e.target.value } as Partial<Block>)}
                className={inputClass}
              />
            </Field>
          </div>
          <WidthPicker
            value={block.width}
            onChange={(width) => onChange({ width } as Partial<Block>)}
          />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- panel içi önizleme */}
                <img src={item.url} alt="" className="h-12 w-12 rounded object-cover" />
                <input
                  value={item.alt}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...items[i], alt: e.target.value };
                    onChange({ items } as Partial<Block>);
                  }}
                  placeholder="Alternatif metin"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({ items: block.items.filter((_, j) => j !== i) } as Partial<Block>)
                  }
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <MediaUploader
            kind="image"
            value=""
            onChange={(url) =>
              url &&
              onChange({
                items: [...block.items, { url, alt: "", caption: "" }],
              } as Partial<Block>)
            }
            label="Galeriye görsel ekle"
          />

          <Field label="Sütun sayısı">
            <div className="flex gap-2">
              {([2, 3] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ columns: c } as Partial<Block>)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    block.columns === c
                      ? "border-accent/40 bg-accent/15 text-white"
                      : "border-white/10 bg-white/5 text-muted hover:text-white"
                  }`}
                >
                  {c} sütun
                </button>
              ))}
            </div>
          </Field>
        </div>
      );

    case "video":
      return (
        <div className="space-y-4">
          <MediaUploader
            kind="video"
            value={block.url}
            onChange={(url) => onChange({ url } as Partial<Block>)}
            label="Video"
          />
          <Field label="Alt yazı (opsiyonel)">
            <input
              value={block.caption}
              onChange={(e) => onChange({ caption: e.target.value } as Partial<Block>)}
              className={inputClass}
            />
          </Field>
          <WidthPicker
            value={block.width}
            onChange={(width) => onChange({ width } as Partial<Block>)}
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={block.autoplay}
              onChange={(e) => onChange({ autoplay: e.target.checked } as Partial<Block>)}
              className="rounded border-white/20 bg-white/10"
            />
            Sessiz olarak otomatik oynat (döngüde)
          </label>
        </div>
      );

    case "model3d":
      return (
        <div className="space-y-4">
          <MediaUploader
            kind="model3d"
            value={block.url}
            onChange={(url) => onChange({ url } as Partial<Block>)}
            label="3D model"
          />
          <Field label="Alt yazı (opsiyonel)">
            <input
              value={block.caption}
              onChange={(e) => onChange({ caption: e.target.value } as Partial<Block>)}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <WidthPicker
              value={block.width}
              onChange={(width) => onChange({ width } as Partial<Block>)}
            />
            <Field label="Yükseklik">
              <div className="flex gap-2">
                {(["short", "tall"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange({ height: h } as Partial<Block>)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      block.height === h
                        ? "border-accent/40 bg-accent/15 text-white"
                        : "border-white/10 bg-white/5 text-muted hover:text-white"
                    }`}
                  >
                    {h === "short" ? "Kısa" : "Uzun"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={block.autoRotate}
              onChange={(e) => onChange({ autoRotate: e.target.checked } as Partial<Block>)}
              className="rounded border-white/20 bg-white/10"
            />
            Kendi kendine dönsün (ziyaretçi yine de fareyle çevirebilir)
          </label>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-4">
          <Field label="Alıntı metni">
            <textarea
              rows={3}
              value={block.text}
              onChange={(e) => onChange({ text: e.target.value } as Partial<Block>)}
              className={`${inputClass} resize-y`}
            />
          </Field>
          <Field label="Kim söyledi (opsiyonel)">
            <input
              value={block.author}
              onChange={(e) => onChange({ author: e.target.value } as Partial<Block>)}
              placeholder="Ad Soyad, Şirket"
              className={inputClass}
            />
          </Field>
        </div>
      );

    case "features":
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={item.title}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...items[i], title: e.target.value };
                    onChange({ items } as Partial<Block>);
                  }}
                  placeholder="Başlık"
                  className={inputClass}
                />
                <input
                  value={item.description}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[i] = { ...items[i], description: e.target.value };
                    onChange({ items } as Partial<Block>);
                  }}
                  placeholder="Kısa açıklama"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({ items: block.items.filter((_, j) => j !== i) } as Partial<Block>)
                }
                className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                items: [...block.items, { title: "", description: "" }],
              } as Partial<Block>)
            }
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-muted transition-colors hover:text-white"
          >
            + Madde ekle
          </button>
        </div>
      );

    case "cta":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Buton yazısı">
            <input
              value={block.label}
              onChange={(e) => onChange({ label: e.target.value } as Partial<Block>)}
              placeholder="Erken erişime katıl"
              className={inputClass}
            />
          </Field>
          <Field label="Bağlantı (/sayfa veya https://…)">
            <input
              value={block.href}
              onChange={(e) => onChange({ href: e.target.value } as Partial<Block>)}
              placeholder="/#early-access"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Butonun altındaki not (opsiyonel)">
              <input
                value={block.note}
                onChange={(e) => onChange({ note: e.target.value } as Partial<Block>)}
                placeholder="Kredi kartı gerekmez"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      );
  }
}

export { newBlockId };
