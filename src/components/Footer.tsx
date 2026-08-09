import { Logo } from "./Logo";

const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/lupra" },
  { label: "GitHub", href: "https://github.com/lupra" },
  { label: "LinkedIn", href: "https://linkedin.com/company/lupra" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3 text-muted">
          <Logo iconOnly size={22} />
          <span className="text-sm">© 2026 Lupra</span>
        </div>
        <ul className="flex items-center gap-6">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
