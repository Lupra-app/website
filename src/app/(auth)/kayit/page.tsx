import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/dal";
import { AuthShell } from "../components/AuthShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { SignUpForm } from "./SignUpForm";
import { safeNext } from "../auth-state";

export const metadata = {
  title: "Kayıt ol | Lupra",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  const session = await getUserSession();
  if (session) redirect(next);

  return (
    <AuthShell
      title="Hesap oluştur"
      subtitle="GitHub veya Google ile saniyeler içinde, ya da e-posta ile."
      footer={
        <>
          Zaten hesabın var mı?{" "}
          <Link
            href={`/giris?next=${encodeURIComponent(next)}`}
            className="font-semibold text-accent-light hover:text-white"
          >
            Giriş yap
          </Link>
        </>
      }
    >
      <OAuthButtons next={next} />
      <SignUpForm next={next} />
    </AuthShell>
  );
}
