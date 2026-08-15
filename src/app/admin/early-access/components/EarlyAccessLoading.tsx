export function EarlyAccessLoading() {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-24 animate-pulse rounded bg-white/10"></div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-32 animate-pulse rounded bg-white/10"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="px-6 py-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-white/5"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-white/5"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
