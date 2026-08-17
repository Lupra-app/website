import { requireUser } from "@/lib/dal";
import { getLinkedIdentities, getProfile } from "@/lib/profile-data";
import { formatDate } from "@/lib/format";
import { ProfileSettingsForm } from "../components/ProfileSettingsForm";
import {
  DeleteAccount,
  EmailSettings,
  PasswordSettings,
} from "../components/SecuritySettings";

export const metadata = {
  title: "Ayarlar | Lupra",
  robots: { index: false, follow: false },
};

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  google: "Google",
  email: "E-posta ve şifre",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const session = await requireUser("/profil/ayarlar");
  const [profile, identities] = await Promise.all([
    getProfile(session.userId),
    getLinkedIdentities(session.userId),
  ]);

  const hasPassword = identities.some((i) => i.provider === "email");

  return (
    <div className="space-y-6">
      <Section title="Profil" description="Bu bilgiler hesabında görünür.">
        <ProfileSettingsForm profile={profile} />
      </Section>

      <Section
        title="Bağlı hesaplar"
        description="Hesabına giriş yapabildiğin yöntemler."
      >
        {identities.length === 0 ? (
          <p className="text-sm text-muted">Bağlı hesap bilgisi okunamadı.</p>
        ) : (
          <ul className="space-y-2">
            {identities.map((identity) => (
              <li
                key={identity.provider}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="font-medium text-white">
                  {PROVIDER_LABELS[identity.provider] ?? identity.provider}
                </span>
                <span className="text-xs text-muted">
                  {identity.email ?? "—"}
                  {identity.createdAt && ` · ${formatDate(identity.createdAt)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted/70">
          Yeni bir yöntem bağlamak için o yöntemle giriş yaptığında hesaplar aynı e-posta
          üzerinden birleşir.
        </p>
      </Section>

      <Section title="E-posta">
        <EmailSettings currentEmail={session.email} />
      </Section>

      <Section title="Şifre">
        <PasswordSettings hasPassword={hasPassword} />
      </Section>

      <Section title="Hesabı sil" description="Bu işlem geri alınamaz.">
        <DeleteAccount email={session.email} isAdmin={session.isAdmin} />
      </Section>
    </div>
  );
}
