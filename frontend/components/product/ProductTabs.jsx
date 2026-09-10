"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

function AccordionItem({ title, children, open, onToggle }) {
  return (
    <div className="border-b">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-ink">{title}</span>
        <ChevronDown
          size={18}
          className={`text-ink-soft transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm leading-relaxed text-ink-soft">{children}</div>
      )}
    </div>
  );
}

const SHIPPING_TEXT =
  "Orders ship within 2 business days. Delivery typically takes 3–7 days depending on location.";
const RETURNS_TEXT =
  "Unopened products can be returned within 7 days of delivery. Perishable items (ghee, dairy) cannot be returned once opened.";

const FAQS = [
  {
    q: "How should I store this product?",
    a: "Keep it in a cool, dry place away from direct sunlight unless the product page says otherwise.",
  },
  {
    q: "Is this suitable for daily use?",
    a: "Yes — our products are made for everyday use, the same way they're used at the goshala.",
  },
];

export default function ProductTabs({ product }) {
  const [openId, setOpenId] = useState("description");
  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <div className="mt-4">
      <AccordionItem
        title="Description"
        open={openId === "description"}
        onToggle={() => toggle("description")}
      >
        {product.description}
      </AccordionItem>

      {product.ingredients && (
        <AccordionItem
          title="Ingredients"
          open={openId === "ingredients"}
          onToggle={() => toggle("ingredients")}
        >
          {product.ingredients}
        </AccordionItem>
      )}

      {product.usageInstructions && (
        <AccordionItem
          title="Usage Instructions"
          open={openId === "usage"}
          onToggle={() => toggle("usage")}
        >
          {product.usageInstructions}
        </AccordionItem>
      )}

      <AccordionItem
        title="Shipping"
        open={openId === "shipping"}
        onToggle={() => toggle("shipping")}
      >
        {SHIPPING_TEXT}
      </AccordionItem>

      <AccordionItem
        title="Returns"
        open={openId === "returns"}
        onToggle={() => toggle("returns")}
      >
        {RETURNS_TEXT}
      </AccordionItem>

      <AccordionItem title="FAQs" open={openId === "faqs"} onToggle={() => toggle("faqs")}>
        <div className="flex flex-col gap-3">
          {FAQS.map((f) => (
            <div key={f.q}>
              <p className="font-medium text-ink">{f.q}</p>
              <p className="mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </AccordionItem>
    </div>
  );
}
