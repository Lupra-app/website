import { requireUser } from "@/lib/dal";
import { PasswordSettings } from "../components/SecuritySettings";

export const metadata = {
  title: "Yeni şifre belirle | Lupra",
  robots: { index: false, follow: false },
};

/**
 * Şifre sıfırlama bağlantısının indiği sayfa.
 *
 * Bağlantıya tıklayan kullanıcı /auth/callback üzerinden oturum açmış olarak
 * buraya gelir, dolayısıyla requireUser() geçer ve yeni şifresini belirler.
 * Oturumu olmayan biri buraya gelirse girişe yönlenir — sıfırlama bağlantısı
 * olmadan şifre değiştirilemez.
 */
export default async function PasswordRenewPage() {
  await requireUser("/profil/sifre-yenile");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-heading text-lg font-semibold text-white">Yeni şifreni belirle</h2>
      <p className="mt-1 text-sm text-muted">
        Bundan sonra e-posta ve bu şifreyle giriş yapabilirsin.
      </p>
      <div className="mt-5">
        <PasswordSettings hasPassword />
      </div>
    </div>
  );
}
