export function CitySilhouette({
  color,
  className = '',
  height = 42,
  layout = 'overlay',
}: {
  color: string;
  className?: string;
  height?: number;
  layout?: 'overlay' | 'inline';
}) {
  const layoutClass =
    layout === 'inline'
      ? 'block w-full'
      : 'absolute bottom-0 left-0 w-full z-[2]';

  return (
    <svg
      className={`${layoutClass} pointer-events-none ${className}`.trim()}
      viewBox="0 0 300 45"
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
      aria-hidden
    >
      <path
        d={`M0,45 L0,30 L8,30 L8,24 L12,24 L12,30 L18,30 L18,20 L22,20 L22,16 L26,16 L26,20 L30,20 L30,30 
            L38,30 L38,26 L42,26 L42,30 L50,30 L50,22 L54,22 L54,18 L58,18 L58,14 L62,14 L62,18 L66,18 L66,22 L70,22 L70,30 
            L78,30 L78,24 L82,24 L82,30 L90,30 L90,12 L93,12 L93,9 L97,9 L97,12 L100,12 L100,30 
            L108,30 L108,26 L112,26 L112,22 L116,22 L116,30 L124,30 L124,28 L128,28 L128,30 
            L136,30 L136,16 L138,16 L138,11 L142,11 L142,7 L146,7 L146,11 L148,11 L148,16 L150,16 L150,30 
            L158,30 L158,24 L162,24 L162,20 L166,20 L166,24 L170,24 L170,30 
            L178,30 L178,22 L182,22 L182,30 L190,30 L190,18 L194,18 L194,14 L198,14 L198,18 L202,18 L202,30 
            L210,30 L210,26 L214,26 L214,30 L222,30 L222,20 L225,20 L225,15 L228,15 L228,11 L232,11 L232,15 L235,15 L235,20 L238,20 L238,30 
            L246,30 L246,24 L250,24 L250,30 L258,30 L258,28 L262,28 L262,30 
            L270,30 L270,22 L274,22 L274,18 L278,18 L278,22 L282,22 L282,30 L290,30 L290,26 L294,26 L294,30 L300,30 L300,45 Z`}
        fill={color}
      />
      <rect x="60" y="16" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="93" y="11" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3" />
      <rect x="143" y="9" width="2" height="2" fill="rgba(255,220,100,0.8)" rx="0.3">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
      </rect>
      <rect x="145" y="13" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3" />
      <rect x="195" y="16" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="5s" repeatCount="indefinite" />
      </rect>
      <rect x="229" y="13" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3" />
      <rect x="231" y="17" width="2" height="2" fill="rgba(255,220,100,0.4)" rx="0.3">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" repeatCount="indefinite" />
      </rect>
      <rect x="275" y="20" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3" />
      <rect x="22" y="18" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="4.5s" repeatCount="indefinite" />
      </rect>
      <rect x="54" y="20" width="2" height="2" fill="rgba(255,220,100,0.6)" rx="0.3" />
      <rect x="113" y="24" width="2" height="2" fill="rgba(255,220,100,0.7)" rx="0.3" />
      <rect x="163" y="22" width="2" height="2" fill="rgba(255,220,100,0.5)" rx="0.3">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="6s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
