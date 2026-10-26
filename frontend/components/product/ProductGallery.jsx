"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function ProductGallery({ images = [], name = "Product" }) {
  const [active, setActive] = useState(0);
  const [errorMap, setErrorMap] = useState({});

  const validImages =
    Array.isArray(images) && images.length > 0
      ? images
      : ["https://placehold.co/800x800/fbf7ed/2e2315?text=Brundavanam+Organic"];

  const currentSrc =
    errorMap[active]
      ? "https://placehold.co/800x800/fbf7ed/2e2315?text=Brundavanam+Goshala"
      : validImages[active] || validImages[0];

  return (
    <div className="space-y-4">
      {/* 1. Main Showcase Image Viewer */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line/80 bg-[#fbf7ed] shadow-xs group">
        <img
          src={currentSrc}
          alt={name}
          onError={() => setErrorMap((prev) => ({ ...prev, [active]: true }))}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Purity Guarantee Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1813]/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 shadow-md">
            <Sparkles size={13} className="text-amber-400" />
            <span>100% Organic</span>
          </span>
        </div>

        {/* Trust Bottom Stamp */}
        <div className="absolute bottom-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-ink-soft border border-line shadow-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Vedic Lab Certified</span>
          </span>
        </div>
      </div>

      {/* 2. Thumbnail Strip */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {validImages.map((src, i) => {
            const isSelected = active === i;
            const thumbSrc = errorMap[i]
              ? "https://placehold.co/150x150/fbf7ed/2e2315?text=Img"
              : src;

            return (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View photo ${i + 1} of ${name}`}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all shadow-2xs ${isSelected
                    ? "border-accent ring-2 ring-accent/30 scale-105 shadow-md"
                    : "border-line bg-surface opacity-70 hover:opacity-100 hover:border-accent/60"
                  }`}
              >
                <img
                  src={thumbSrc}
                  alt=""
                  onError={() => setErrorMap((prev) => ({ ...prev, [i]: true }))}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
