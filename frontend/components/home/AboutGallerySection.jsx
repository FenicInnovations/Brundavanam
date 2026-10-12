"use client";

import { useState, useEffect } from "react";
import { Play, Image as ImageIcon, ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";

function getYoutubeId(url) {
  const match = url?.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
}

function GalleryLightbox({ items, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const item = items[current];

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const prev = () => setCurrent((c) => (c === 0 ? items.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === items.length - 1 ? 0 : c + 1));

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Media */}
        <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          {item.type === "image" && (
            <img src={item.url} alt={item.title} className="w-full h-full object-contain" />
          )}
          {item.type === "youtube" && (
            <iframe
              src={`https://www.youtube.com/embed/${item.youtubeId || getYoutubeId(item.url)}?autoplay=1`}
              title={item.title || "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}
          {item.type === "video" && (
            <video src={item.url} controls autoPlay className="w-full h-full object-contain" />
          )}
          {item.type === "external_video" && (
            <iframe
              src={item.url}
              title={item.title || "Video"}
              allowFullScreen
              className="w-full h-full"
            />
          )}
        </div>

        {/* Caption */}
        {(item.title || item.description) && (
          <div className="mt-3 text-center">
            {item.title && <p className="text-white font-semibold">{item.title}</p>}
            {item.description && <p className="text-white/70 text-sm mt-0.5">{item.description}</p>}
          </div>
        )}

        {/* Navigation */}
        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="mt-2 text-center text-white/50 text-xs">
          {current + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}

function GalleryThumbnail({ item, index, onClick }) {
  const isVideo =
    item.type === "youtube" || item.type === "video" || item.type === "external_video";

  const thumbSrc =
    item.thumbnailUrl ||
    (item.type === "youtube"
      ? `https://img.youtube.com/vi/${item.youtubeId || getYoutubeId(item.url)}/hqdefault.jpg`
      : item.type === "image"
      ? item.url
      : null);

  return (
    <button
      onClick={() => onClick(index)}
      className="group relative aspect-video rounded-2xl overflow-hidden bg-stone-900 border border-amber-200/30 hover:border-amber-400/60 transition-all hover:scale-[1.02] shadow-sm hover:shadow-lg"
    >
      {thumbSrc ? (
        <img
          src={thumbSrc}
          alt={item.title || "Gallery item"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-amber-950/20">
          <ImageIcon className="w-8 h-8 text-amber-400/60" />
        </div>
      )}

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {isVideo ? (
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Video badge */}
      {isVideo && (
        <div className="absolute top-2 right-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
          <Play className="w-2.5 h-2.5 fill-white" />
          {item.type === "youtube" ? "YouTube" : "Video"}
        </div>
      )}

      {/* Title */}
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs font-semibold truncate">{item.title}</p>
        </div>
      )}
    </button>
  );
}

const DEFAULT_GALLERY_ITEMS = [
  {
    _id: "default-1",
    type: "image",
    title: "Gaumata & Sacred Calf",
    description: "Our beloved indigenous cow and calf at Brundavanam Goshala.",
    url: "/images/brochure/hero_gaumata_calf.jpg",
    isPublished: true,
  },
  {
    _id: "default-2",
    type: "image",
    title: "Amrutha Dhara Pure Drops",
    description: "Pure Ayurvedic wellness remedy for cold, headache & breathing soothing.",
    url: "/images/amrutha_dhara.jpg",
    isPublished: true,
  },
  {
    _id: "default-3",
    type: "image",
    title: "Sahaja Kunkuma Divine Sacred Kumkum",
    description: "100% natural, cow-based chemical-free kunkuma for auspicious puja.",
    url: "/images/sahaja_kunkuma.jpg",
    isPublished: true,
  },
  {
    _id: "default-4",
    type: "image",
    title: "Gau Dhara Universal Pain Relief Oil",
    description: "Ancient Ayurvedic herb and cow-based herbal healing oil.",
    url: "/images/gau_dhara.jpg",
    isPublished: true,
  },
  {
    _id: "default-5",
    type: "image",
    title: "Sunset over Pastoral Sanctuary",
    description: "Peaceful evening across the protected sanctuary pastures.",
    url: "/images/brochure/pastoral_sanctuary_sunset.jpg",
    isPublished: true,
  },
  {
    _id: "default-6",
    type: "image",
    title: "Sacred Gratitude to Gaumata",
    description: "Honoring our timeless bond with mother cow.",
    url: "/images/brochure/sacred_gaumata_gratitude.jpg",
    isPublished: true,
  },
];

export default function AboutGallerySection() {
  const [items, setItems] = useState(DEFAULT_GALLERY_ITEMS);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // index of item to show in lightbox
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadGallery() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/gallery`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setItems(data.data);
        } else {
          setItems(DEFAULT_GALLERY_ITEMS);
        }
      } catch (err) {
        console.error("Failed to load gallery:", err);
        setItems(DEFAULT_GALLERY_ITEMS);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const filteredItems =
    filter === "all"
      ? items
      : filter === "video"
      ? items.filter((i) => i.type === "youtube" || i.type === "video" || i.type === "external_video")
      : items.filter((i) => i.type === "image");

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-video rounded-2xl bg-amber-100/30 animate-pulse border border-amber-200/40"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-amber-200/60 text-sm italic">Gallery coming soon...</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      {items.some((i) => i.type !== "image") && (
        <div className="flex gap-2 mb-6">
          {[
            { val: "all", label: "All" },
            { val: "image", label: "Photos" },
            { val: "video", label: "Videos" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setFilter(tab.val)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filter === tab.val
                  ? "bg-amber-400 text-stone-950 border-amber-400"
                  : "border-amber-400/30 text-amber-200 hover:border-amber-400/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredItems.map((item, idx) => (
          <GalleryThumbnail
            key={item._id}
            item={item}
            index={idx}
            onClick={(i) => setLightbox(i)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <GalleryLightbox
          items={filteredItems}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
