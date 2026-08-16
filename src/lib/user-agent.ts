/**
 * User-agent'tan cihaz/tarayıcı/işletim sistemi türetir.
 *
 * Ham user-agent string'i KASITLI olarak saklanmıyor: tek başına bir tarayıcıyı
 * parmak izi düzeyinde ayırt edecek kadar ayrıntılı. Buradan çıkan üç kaba
 * kategori "kayıtların çoğu mobilden mi geliyor" sorusunu cevaplamaya yetiyor,
 * kimseyi tekil olarak işaret etmiyor.
 *
 * Kütüphane yerine elle ayrıştırma: gerçek trafiğin neredeyse tamamı bir avuç
 * tarayıcıdan geliyor ve tam bir UA veritabanını bakımda tutmanın karşılığı yok.
 */

export type DeviceType = "mobile" | "tablet" | "desktop";

export type UserAgentInfo = {
  deviceType: DeviceType;
  browser: string;
  os: string;
};

export function parseUserAgent(ua: string | null | undefined): UserAgentInfo {
  const s = ua ?? "";

  // Sıra önemli: iPad'in UA'sı "Mobile" da içerebiliyor, tablet önce bakılıyor.
  const deviceType: DeviceType = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s)
    ? "tablet"
    : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s)
      ? "mobile"
      : "desktop";

  // Chrome tabanlı tarayıcılar UA'larında "Chrome" da taşır, Safari "Safari" —
  // o yüzden en spesifik olandan başlanıyor.
  const browser = /Edg\//i.test(s)
    ? "Edge"
    : /OPR\/|Opera/i.test(s)
      ? "Opera"
      : /SamsungBrowser/i.test(s)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS/i.test(s)
          ? "Firefox"
          : /Chrome\/|CriOS/i.test(s)
            ? "Chrome"
            : /Safari\//i.test(s)
              ? "Safari"
              : "Bilinmiyor";

  const os = /Windows/i.test(s)
    ? "Windows"
    : /iPhone|iPad|iPod|iOS/i.test(s)
      ? "iOS"
      : /Mac OS X|Macintosh/i.test(s)
        ? "macOS"
        : /Android/i.test(s)
          ? "Android"
          : /Linux/i.test(s)
            ? "Linux"
            : "Bilinmiyor";

  return { deviceType, browser, os };
}

export const DEVICE_LABELS: Record<DeviceType, string> = {
  mobile: "Mobil",
  tablet: "Tablet",
  desktop: "Masaüstü",
};

/**
 * Referrer URL'ini okunabilir bir kaynak adına indirger.
 * "https://www.google.com/search?q=..." → "google.com"
 */
export function referrerLabel(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}
