export default function EarlyAccessLoading() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor">
      <div className="mb-8 h-9 w-72 animate-pulse rounded-lg bg-white/10" />
      <div className="glass overflow-hidden rounded-2xl border border-white/15">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 border-b border-white/5 px-6 py-4">
            <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
