export function VariantSelector({ variants, selectedId, onSelect }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">Size</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedId;
          const outOfStock = v.stock <= 0;
          return (
            <button
              key={v.id}
              type="button"
              disabled={outOfStock}
              onClick={() => onSelect(v.id)}
              className={`rounded border px-4 py-2 text-sm transition-colors duration-150 ${
                isSelected
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-ink hover:border-ink"
              } ${outOfStock ? "cursor-not-allowed opacity-40" : ""}`}
            >
              {v.label}
              {outOfStock && " (Out of stock)"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuantitySelector({ quantity, onChange, max = 10 }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">Quantity</p>
      <div className="mt-2 inline-flex items-center rounded border">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => onChange(Math.max(1, quantity - 1))}
          className="flex h-10 w-10 items-center justify-center text-ink disabled:opacity-30"
          disabled={quantity <= 1}
        >
          −
        </button>
        <span className="w-8 text-center text-sm text-ink">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => onChange(Math.min(max, quantity + 1))}
          className="flex h-10 w-10 items-center justify-center text-ink disabled:opacity-30"
          disabled={quantity >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
