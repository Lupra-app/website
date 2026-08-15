"use client";

import { useSyncExternalStore } from "react";

/**
 * Medya sorgusunu React state'i olarak okur.
 *
 * useState + useEffect DEĞİL: o kalıp projenin `react-hooks/set-state-in-effect`
 * lint kuralına takılıyor ve ilk render'da yanlış değerle bir kare çiziyor.
 * Aynı yaklaşım SmoothScroll.tsx'te de kullanılıyor.
 *
 * Sunucuda her zaman `false` döner — yani medya sorgusuna bağlı ağır
 * bileşenler sunucuda hiç render edilmez, istemcide eşleşirse mount edilir.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
