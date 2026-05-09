'use client';

import { useEffect, useState } from 'react';
import { Tag, Megaphone } from 'lucide-react';

interface PublicCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
  expires_at: string | null;
}

type BarItem =
  | { kind: 'coupon'; coupon: PublicCoupon }
  | { kind: 'announcement'; message: string };

function formatCoupon(c: PublicCoupon): string {
  const value =
    c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`;
  const min = c.min_order > 0 ? ` on orders over ৳${c.min_order}` : '';
  return `Use code ${c.code} for ${value}${min}`;
}

export default function AnnouncementBar() {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/coupon/active').then((r) => r.json()).catch(() => ({ coupons: [] })),
      fetch('/api/announcements/active').then((r) => r.json()).catch(() => ({ announcements: [] })),
    ]).then(([cd, ad]) => {
      if (cancelled) return;
      setCoupons(cd.coupons || []);
      setAnnouncements(ad.announcements || []);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  // Interleave announcements and coupons so the bar feels varied.
  const items: BarItem[] = [];
  const maxLen = Math.max(coupons.length, announcements.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < announcements.length) items.push({ kind: 'announcement', message: announcements[i] });
    if (i < coupons.length) items.push({ kind: 'coupon', coupon: coupons[i] });
  }

  // Repeat enough times to fill the viewport, then duplicate for seamless loop.
  const REPEAT = items.length > 0 ? Math.max(4, Math.ceil(8 / items.length)) : 0;
  const base = Array.from({ length: REPEAT }, () => items).flat();
  const loop = items.length > 0 ? [...base, ...base] : [];

  if (loop.length === 0) return null;

  return (
    <div className="bg-black text-white text-base leading-none">
      <div className="overflow-hidden w-full px-4 py-2">
        <div className="marquee-track flex w-max whitespace-nowrap will-change-transform">
          {loop.map((item, i) =>
            item.kind === 'coupon' ? (
              <button
                key={`c-${item.coupon.code}-${i}`}
                type="button"
                onClick={() => handleCopy(item.coupon.code)}
                className="floaty inline-flex items-center gap-1.5 mr-12 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/40 rounded px-1.5 py-0.5 text-white"
                title="Click to copy code"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="font-medium">{formatCoupon(item.coupon)}</span>
                <span
                  className={`ml-0.5 text-base px-1 py-px rounded transition-colors ${
                    copied === item.coupon.code ? 'bg-white text-rose-600' : 'bg-white/15 text-white'
                  }`}
                >
                  {copied === item.coupon.code ? 'COPIED!' : 'COPY'}
                </span>
              </button>
            ) : (
              <span
                key={`a-${i}`}
                className="floaty inline-flex items-center gap-1.5 mr-12 px-1.5 py-0.5 text-white"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span className="font-medium">{item.message}</span>
              </span>
            )
          )}
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee 80s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .floaty {
          animation: floaty 2.6s ease-in-out infinite;
        }
        @keyframes floaty {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track,
          .floaty {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
