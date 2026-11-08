export function SlimeJarArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="presentation" focusable="false">
      <rect width="200" height="200" fill="#F7F1E4" />
      <circle cx="30" cy="36" r="10" fill="#A99BEA" stroke="#343A35" strokeWidth="3" />
      <circle cx="170" cy="62" r="6" fill="#E98B62" stroke="#343A35" strokeWidth="3" />
      <circle cx="158" cy="30" r="4" fill="#D5E66D" stroke="#343A35" strokeWidth="2.5" />
      <path d="M40 70 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="#E98B62" stroke="#343A35" strokeWidth="2" strokeLinejoin="round" />
      <path d="M168 104 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5z" fill="#A99BEA" stroke="#343A35" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="100" cy="176" rx="64" ry="9" fill="#D5E66D" stroke="#343A35" strokeWidth="3" />
      <path
        d="M66 112 Q82 104 100 112 T134 112 L134 152 Q134 166 120 166 L80 166 Q66 166 66 152 Z"
        fill="#D5E66D"
      />
      <path
        d="M64 92 L64 152 Q64 168 80 168 L120 168 Q136 168 136 152 L136 92"
        fill="none"
        stroke="#343A35"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="56" y="86" width="88" height="11" rx="5.5" fill="#F7F1E4" stroke="#343A35" strokeWidth="3.5" />
      <path
        d="M54 100 C48 70 74 48 100 48 C126 48 152 70 146 100 Q146 112 139 112 Q132 112 132 102 Q124 106 116 102 Q110 126 106 138 Q104 146 98 146 Q92 146 92 138 Q92 114 86 102 Q76 106 68 102 Q68 112 61 112 Q54 112 54 100 Z"
        fill="#D5E66D"
        stroke="#343A35"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <ellipse cx="84" cy="68" rx="10" ry="6" fill="#FFFFFF" opacity="0.7" transform="rotate(-24 84 68)" />
      <circle cx="116" cy="70" r="5.5" fill="#F7F1E4" stroke="#343A35" strokeWidth="2.5" />
      <circle cx="104" cy="84" r="3" fill="#F7F1E4" stroke="#343A35" strokeWidth="2" />
      <circle cx="84" cy="136" r="6" fill="#F7F1E4" stroke="#343A35" strokeWidth="2.5" />
      <circle cx="108" cy="148" r="4" fill="#F7F1E4" stroke="#343A35" strokeWidth="2.5" />
      <g transform="rotate(-16 36 152)">
        <rect x="14" y="142" width="44" height="18" rx="5" fill="#E98B62" stroke="#343A35" strokeWidth="3.5" />
        <path d="M22 146 v10 M30 146 v10 M38 146 v10 M46 146 v10" stroke="#343A35" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
