import { useState } from 'react';
import type { Company } from 'shared';

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function textOn(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#161412';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#161412' : '#f3eee4';
}

export function logoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export default function Logo({ company, size = 56, className = '' }: { company: Company; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const style = { width: size, height: size };
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-white ${className}`} style={style}>
      {(failed || !loaded) && (
        <div
          className="absolute inset-0 flex items-center justify-center font-display font-bold"
          style={{ background: company.brandColor, color: textOn(company.brandColor), fontSize: size * 0.38 }}
        >
          {initials(company.name)}
        </div>
      )}
      {!failed && (
        <img
          src={logoUrl(company.domain)}
          alt={`${company.name} logo`}
          width={size}
          height={size}
          loading="lazy"
          onLoad={(e) => {
            // Google returns a 16px globe when it has nothing; treat tiny as failed.
            const img = e.currentTarget;
            if (img.naturalWidth < 32) setFailed(true); else setLoaded(true);
          }}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain p-1.5"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity .3s' }}
        />
      )}
    </div>
  );
}
