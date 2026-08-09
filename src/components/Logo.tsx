type LogoProps = {
  className?: string;
  iconOnly?: boolean;
  size?: number;
};

export function Logo({ className = "", iconOnly = false, size = 32 }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M35.82 10.33 A22 22 0 1 0 53.67 28.18"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="47.56" cy="16.44" r="5.5" fill="#818CF8" />
      </svg>
      {!iconOnly && (
        <span className="font-heading text-xl font-semibold lowercase tracking-tight text-white">
          lupra
        </span>
      )}
    </span>
  );
}
