"use client";

import { X } from "lucide-react";

/**
 * Generic mobile bottom sheet — used for the Shop page's filter and
 * sort drawers so we don't build two bespoke overlays.
 */
export default function BottomSheet({ open, onClose, title, children }) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-4 shadow-xl transition-transform duration-250 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg text-ink">{title}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center"
          >
            <X size={20} className="text-ink" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
