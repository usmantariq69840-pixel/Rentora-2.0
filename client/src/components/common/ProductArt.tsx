import { useId } from 'react';
import type { ArtKind } from '../../types';

/**
 * Original, generic product illustrations used as placeholders until a
 * listing has a real photo. Drop real photos in later: <ListingImage> shows
 * the photo when `imageUrl` exists and falls back to this artwork otherwise.
 */
interface Props {
  kind: ArtKind;
  label?: string;
  className?: string;
}

export default function ProductArt({ kind, label, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const ref = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="0 0 240 180"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#334155" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={id('light')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <radialGradient id={id('glass')} cx="0.38" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="0.35" stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
        <linearGradient id={id('screen')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#172554" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id={id('beam')} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#5eead4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="158" rx="78" ry="7" fill="#0f172a" opacity="0.12" />

      {kind === 'camera' && (
        <g>
          <rect x="88" y="42" width="64" height="26" rx="7" fill={ref('body')} />
          <rect x="96" y="48" width="22" height="9" rx="3" fill="#475569" />
          <rect x="34" y="60" width="172" height="90" rx="15" fill={ref('body')} />
          <rect x="34" y="60" width="38" height="90" rx="15" fill="#1e293b" opacity="0.55" />
          <rect x="50" y="50" width="24" height="10" rx="3" fill="#14b8a6" />
          <rect x="170" y="50" width="24" height="11" rx="3" fill="#94a3b8" />
          <circle cx="192" cy="82" r="4" fill="#14b8a6" />
          <circle cx="120" cy="108" r="45" fill="#020617" />
          <circle cx="120" cy="108" r="40" fill="none" stroke="#475569" strokeWidth="4" />
          <circle cx="120" cy="108" r="32" fill={ref('glass')} />
          <circle cx="120" cy="108" r="13" fill="#020617" opacity="0.75" />
          <ellipse cx="108" cy="95" rx="9" ry="5" fill="#fff" opacity="0.45" transform="rotate(-35 108 95)" />
        </g>
      )}

      {kind === 'actioncam' && (
        <g>
          <rect x="96" y="132" width="48" height="14" rx="3" fill="#475569" />
          <rect x="104" y="140" width="6" height="14" rx="2" fill="#334155" />
          <rect x="130" y="140" width="6" height="14" rx="2" fill="#334155" />
          <rect x="58" y="40" width="124" height="96" rx="18" fill={ref('body')} />
          <rect x="66" y="48" width="108" height="80" rx="12" fill="#0b1220" opacity="0.5" />
          <circle cx="102" cy="88" r="29" fill="#020617" />
          <circle cx="102" cy="88" r="24" fill={ref('glass')} />
          <circle cx="102" cy="88" r="9" fill="#020617" opacity="0.7" />
          <ellipse cx="93" cy="78" rx="7" ry="4" fill="#fff" opacity="0.45" transform="rotate(-35 93 78)" />
          <rect x="142" y="58" width="30" height="26" rx="5" fill={ref('screen')} />
          <circle cx="157" cy="100" r="3.5" fill="#14b8a6" />
        </g>
      )}

      {kind === 'console' && (
        <g>
          <rect x="84" y="20" width="72" height="124" rx="30" fill={ref('light')} />
          <rect x="108" y="28" width="24" height="108" rx="12" fill={ref('body')} />
          <rect x="117" y="40" width="6" height="24" rx="3" fill="#14b8a6" />
          <circle cx="120" cy="118" r="4" fill="#475569" />
          <rect x="76" y="140" width="88" height="8" rx="4" fill="#475569" />
          <g transform="translate(150 90) scale(0.4)">
            <path
              d="M74 62C52 62 36 106 42 138c3 15 18 17 28 4l18-24h64l18 24c10 13 25 11 28-4 6-32-10-76-32-76Z"
              fill={ref('body')}
            />
            <circle cx="160" cy="80" r="6" fill="#14b8a6" />
            <circle cx="108" cy="108" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3" />
            <circle cx="134" cy="108" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3" />
          </g>
        </g>
      )}

      {kind === 'controller' && (
        <g>
          <path
            d="M74 62C52 62 36 106 42 138c3 15 18 17 28 4l18-24h64l18 24c10 13 25 11 28-4 6-32-10-76-32-76Z"
            transform="translate(0 -2)"
            fill={ref('body')}
          />
          <rect x="82" y="86" width="22" height="7" rx="2" fill="#94a3b8" />
          <rect x="89.5" y="78.5" width="7" height="22" rx="2" fill="#94a3b8" />
          <circle cx="160" cy="80" r="5.5" fill="#14b8a6" />
          <circle cx="174" cy="92" r="5.5" fill="#f59e0b" />
          <circle cx="146" cy="92" r="5.5" fill="#94a3b8" />
          <circle cx="160" cy="104" r="5.5" fill="#5eead4" />
          <circle cx="108" cy="108" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3" />
          <circle cx="134" cy="108" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3" />
          <rect x="108" y="86" width="24" height="6" rx="3" fill="#475569" />
        </g>
      )}

      {kind === 'bike' && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="62" cy="116" r="35" stroke="#0f172a" strokeWidth="5" />
          <circle cx="178" cy="116" r="35" stroke="#0f172a" strokeWidth="5" />
          <circle cx="62" cy="116" r="30" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 5" />
          <circle cx="178" cy="116" r="30" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 5" />
          <path d="M62 116 98 74 150 74 114 116 62 116M98 74 114 116M150 74 178 116" stroke="#0f766e" strokeWidth="5" />
          <path d="M150 74 144 60 160 56M86 66h20" stroke="#0f172a" strokeWidth="5" />
          <circle cx="114" cy="116" r="9" fill="#1e293b" stroke="#14b8a6" strokeWidth="3" />
          <circle cx="62" cy="116" r="4" fill="#14b8a6" stroke="none" />
          <circle cx="178" cy="116" r="4" fill="#14b8a6" stroke="none" />
        </g>
      )}

      {kind === 'projector' && (
        <g>
          <polygon points="58,96 0,60 0,138 58,108" fill={ref('beam')} />
          <rect x="44" y="74" width="156" height="62" rx="15" fill={ref('light')} />
          <rect x="44" y="74" width="156" height="12" rx="6" fill="#fff" opacity="0.7" />
          <circle cx="82" cy="104" r="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="82" cy="104" r="16" fill={ref('glass')} />
          <ellipse cx="76" cy="98" rx="5" ry="3" fill="#fff" opacity="0.5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={132 + i * 11} y="92" width="5" height="26" rx="2.5" fill="#94a3b8" opacity="0.7" />
          ))}
          <circle cx="188" cy="86" r="3" fill="#14b8a6" />
          <rect x="66" y="136" width="18" height="7" rx="3" fill="#475569" />
          <rect x="160" y="136" width="18" height="7" rx="3" fill="#475569" />
        </g>
      )}

      {kind === 'laptop' && (
        <g>
          <rect x="58" y="34" width="124" height="86" rx="9" fill={ref('body')} />
          <rect x="65" y="41" width="110" height="72" rx="4" fill={ref('screen')} />
          <circle cx="98" cy="72" r="14" fill="#fff" opacity="0.14" />
          <rect x="112" y="62" width="48" height="5" rx="2.5" fill="#fff" opacity="0.8" />
          <rect x="112" y="73" width="34" height="4" rx="2" fill="#fff" opacity="0.5" />
          <rect x="112" y="83" width="42" height="4" rx="2" fill="#fff" opacity="0.5" />
          <path d="M26 128h188l-10 16a6 6 0 0 1-5 3H41a6 6 0 0 1-5-3Z" fill={ref('light')} />
          <rect x="102" y="128" width="36" height="5" rx="2.5" fill="#94a3b8" />
        </g>
      )}

      {kind === 'speaker' && (
        <g fill="none" strokeLinecap="round">
          <path d="M60 78c-8 8-8 28 0 36M48 68c-14 14-14 46 0 60" stroke="#14b8a6" strokeWidth="4" opacity="0.55" />
          <path d="M180 78c8 8 8 28 0 36M192 68c14 14 14 46 0 60" stroke="#14b8a6" strokeWidth="4" opacity="0.55" />
          <rect x="82" y="30" width="76" height="120" rx="26" fill={ref('body')} />
          <rect x="82" y="50" width="76" height="6" fill="#14b8a6" />
          <circle cx="120" cy="82" r="11" fill="#1e293b" stroke="#475569" strokeWidth="3" />
          <circle cx="120" cy="116" r="23" fill="#1e293b" stroke="#475569" strokeWidth="3" />
          <circle cx="120" cy="116" r="9" fill="#020617" />
          <circle cx="120" cy="40" r="3" fill="#5eead4" />
        </g>
      )}

      {kind === 'sofa' && (
        <g>
          <rect x="52" y="52" width="136" height="54" rx="16" fill={ref('screen')} />
          <rect x="30" y="80" width="34" height="62" rx="14" fill={ref('body')} />
          <rect x="176" y="80" width="34" height="62" rx="14" fill={ref('body')} />
          <rect x="54" y="88" width="132" height="42" rx="12" fill="#1e3a8a" />
          <rect x="54" y="88" width="132" height="12" rx="6" fill="#fff" opacity="0.14" />
          <rect x="94" y="62" width="50" height="22" rx="9" fill="#5eead4" opacity="0.9" />
          <rect x="44" y="140" width="9" height="12" rx="3" fill="#475569" />
          <rect x="187" y="140" width="9" height="12" rx="3" fill="#475569" />
        </g>
      )}

      {kind === 'watch' && (
        <g>
          <rect x="98" y="14" width="44" height="46" rx="10" fill="#334155" />
          <rect x="98" y="122" width="44" height="46" rx="10" fill="#334155" />
          <circle cx="120" cy="90" r="46" fill={ref('light')} stroke="#94a3b8" strokeWidth="4" />
          <circle cx="120" cy="90" r="37" fill={ref('screen')} />
          <circle cx="120" cy="90" r="3.5" fill="#fff" />
          <path d="M120 90V64M120 90l18 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="118" y="56" width="4" height="7" rx="2" fill="#5eead4" transform={`rotate(${i * 90} 120 90)`} />
          ))}
          <rect x="164" y="82" width="8" height="16" rx="3" fill="#64748b" />
        </g>
      )}

      {kind === 'car' && (
        <g>
          <path d="M22 118c0-12 8-18 20-20l30-34c6-6 12-8 22-8h40c10 0 18 3 25 10l24 30c14 2 32 6 32 22v16c0 4-3 7-7 7H29c-4 0-7-3-7-7Z" fill={ref('body')} />
          <path d="M82 70c4-4 8-6 14-6h36c7 0 12 2 17 7l17 24H70Z" fill="#cbd5e1" opacity="0.9" />
          <path d="M118 66v28" stroke="#0f172a" strokeWidth="3" />
          <circle cx="66" cy="132" r="17" fill="#0f172a" />
          <circle cx="66" cy="132" r="8" fill="#94a3b8" />
          <circle cx="178" cy="132" r="17" fill="#0f172a" />
          <circle cx="178" cy="132" r="8" fill="#94a3b8" />
          <rect x="26" y="106" width="14" height="6" rx="3" fill="#5eead4" />
          <rect x="206" y="106" width="10" height="6" rx="3" fill="#fbbf24" />
        </g>
      )}
    </svg>
  );
}
