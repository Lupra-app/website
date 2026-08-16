"use client";

/**
 * Ziyaretçinin siteye NASIL geldiğini ilk açılışta yakalar.
 *
 * Neden ilk açılışta: ziyaretçi reklamdan `?utm_source=x` ile gelip sonra
 * ana sayfaya geçerse adres çubuğundaki etiketler kaybolur, `document.referrer`
 * de artık site içi bir sayfayı gösterir. İlk temas bilgisini sessionStorage'a
 * yazıp formu gönderirken oradan okumak, bu kaybı önlüyor.
 *
 * sessionStorage (localStorage değil): sekme kapanınca silinir, kalıcı bir iz
 * bırakmaz. Toplanan hiçbir alan kişiyi tekil olarak işaret etmiyor.
 */

const KEY = "lupra:attribution";

export type Attribution = {
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  language: string;
};

const EMPTY: Attribution = {
  referrer: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  language: "",
};

function clean(value: string | null): string {
  return (value ?? "").trim().slice(0, 300);
}

/** İlk çağrıda yakalar; sonraki çağrılarda var olanı korur. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    if (sessionStorage.getItem(KEY)) return;

    const params = new URLSearchParams(window.location.search);
    // Site içi gezinmeyi kaynak saymayalım: sadece dışarıdan gelen referrer.
    const rawReferrer = document.referrer;
    const external =
      rawReferrer && !rawReferrer.startsWith(window.location.origin) ? rawReferrer : "";

    const attribution: Attribution = {
      referrer: clean(external),
      utmSource: clean(params.get("utm_source")),
      utmMedium: clean(params.get("utm_medium")),
      utmCampaign: clean(params.get("utm_campaign")),
      language: clean(navigator.language),
    };

    sessionStorage.setItem(KEY, JSON.stringify(attribution));
  } catch {
    // Gizli sekmede veya depolama kapalıyken sessizce vazgeç — kayıt akışı
    // bu bilgi olmadan da çalışmalı.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;

  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, language: clean(navigator.language) };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return EMPTY;
  }
}
