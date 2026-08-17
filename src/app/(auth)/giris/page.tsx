import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/dal";
import { AuthShell } from "../components/AuthShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { SignInForm } from "./SignInForm";
import { authError, safeNext } from "../auth-state";

export const metadata = {
  title: "Giriş yap | Lupra",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  // Zaten girişliyse formu göstermenin anlamı yok.
  const session = await getUserSession();
  if (session) redirect(next);

  return (
    <AuthShell
      title="Giriş yap"
      subtitle="Hesabına eriş ve profilini yönet."
      footer={
        <>
          Hesabın yok mu?{" "}
          <Link
            href={`/kayit?next=${encodeURIComponent(next)}`}
            className="font-semibold text-accent-light hover:text-white"
          >
            Kayıt ol
          </Link>
        </>
      }
    >
      {sp.error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {sp.error === "forbidden"
            ? "Bu hesabın yönetim paneline erişimi yok."
            : authError("server_error")}
        </p>
      )}
      <OAuthButtons next={next} />
      <SignInForm next={next} />
    </AuthShell>
  );
}
