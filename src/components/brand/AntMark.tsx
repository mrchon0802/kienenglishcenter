export function AntMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 88 64" role="img" aria-label="Kien English Center" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M49 23C46 14 48 8 54 4" /><path d="M57 24C63 16 71 14 78 16" />
        <path d="M37 35L21 24L10 26" /><path d="M39 41L23 49L11 47" />
        <path d="M48 43L42 57L31 61" /><path d="M55 40L64 53L76 55" /><path d="M59 34L75 30L84 34" />
      </g>
      <g fill="currentColor">
        <ellipse cx="22" cy="35" rx="13" ry="10" transform="rotate(-18 22 35)" />
        <ellipse cx="47" cy="36" rx="12" ry="11" />
        <ellipse cx="67" cy="31" rx="13" ry="11" transform="rotate(18 67 31)" />
      </g>
      <circle cx="72" cy="28" r="2.2" fill="#10483f" />
    </svg>
  );
}
