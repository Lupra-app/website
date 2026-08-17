import Link from "next/link";
import { AuthShell } from "../components/AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata = {
  title: "Şifre sıfırlama | Lupra",
  robots: { index: false, follow: false },
};

export default function PasswordResetPage() {
  return (
    <AuthShell
      title="Şifreni sıfırla"
      subtitle="E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim."
      footer={
        <Link href="/giris" className="font-semibold text-accent-light hover:text-white">
          Girişe dön
        </Link>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
