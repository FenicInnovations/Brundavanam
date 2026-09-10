"use client";

import { Check } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import { SORT_OPTIONS } from "@/components/shop/sortOptions";

export default function SortSheet({ open, onClose, value, onChange }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Sort by">
      <div className="flex flex-col">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              onChange(opt.id);
              onClose();
            }}
            className="flex items-center justify-between border-b py-3.5 text-left text-sm text-ink last:border-b-0"
          >
            {opt.label}
            {value === opt.id && <Check size={17} className="text-accent" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
