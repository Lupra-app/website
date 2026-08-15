"use client";

import { useState, useMemo } from "react";

interface EarlyAccessRecord {
  id: string;
  email: string;
  created_at: string;
}

export function EarlyAccessTableClient({
  data,
  error,
}: {
  data: EarlyAccessRecord[];
  error: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(
    () =>
      data.filter((record) =>
        record.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [data, searchQuery]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="E-posta ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-8 py-12 text-center">
          <p className="text-sm text-muted">
            {data.length === 0
              ? "Henüz hiçbir kayıt yok."
              : `"${searchQuery}" ile eşleşen kayıt bulunamadı.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left font-semibold text-white">
                  E-posta
                </th>
                <th className="px-6 py-4 text-left font-semibold text-white">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record, idx) => (
                <tr
                  key={record.id}
                  className={`border-b border-white/5 ${
                    idx % 2 === 0 ? "bg-white/[0.01]" : ""
                  } hover:bg-white/10 transition-colors`}
                >
                  <td className="px-6 py-4 text-white">{record.email}</td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(record.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/10 px-6 py-3 text-xs text-muted">
            {filteredData.length} / {data.length} kayıt
          </div>
        </div>
      )}
    </div>
  );
}
