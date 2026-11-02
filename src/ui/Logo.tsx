export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="mark">
      {/* 圆形背景 */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="var(--accent)" opacity="0.1" />
      {/* 字母 W */}
      <path
        d="M7 9 L11 23 L14.5 15 L16 19 L17.5 15 L21 23 L25 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 小星点装饰 */}
      <circle cx="25" cy="8" r="1.5" fill="var(--terra)" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <Mark />
      <span className="logo-text">
        <b>拾词</b>
        {!compact && <small>Word Atlas</small>}
      </span>
    </span>
  );
}
