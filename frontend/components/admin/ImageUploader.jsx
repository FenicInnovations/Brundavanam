"use client";

import React, { useState } from "react";
import {
  Upload,
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { useDispatch } from "@/lib/redux/store";
import { uploadGcsMedia } from "@/lib/redux/slices/productSlice";
import { triggerToast } from "@/lib/redux/slices/adminSlice";

export default function ImageUploader({ images = [], onChange }) {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // File selection handler
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processFiles(files);
    // Reset file input so identical file can be selected if needed
    e.target.value = "";
  };

  const processFiles = async (files) => {
    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        dispatch(triggerToast(`File '${file.name}' is not an image`, "error"));
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        dispatch(triggerToast(`Image '${file.name}' exceeds 10MB limit`, "error"));
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    // 1. Immediately create preview entries and display them in the grid right away
    const startingIndex = images.length;
    const initialPlaceholders = validFiles.map((file, idx) => {
      const localPreview = URL.createObjectURL(file);
      const tempId = `temp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      const isPrimary = startingIndex === 0 && idx === 0 && !images.some((img) => img.isPrimary);

      return {
        fileId: tempId,
        fileName: file.name,
        fileType: "image",
        mimeType: file.type,
        size: file.size,
        bucketName: "radhakrishnan",
        storagePath: `products/${file.name}`,
        publicUrl: localPreview,
        previewUrl: localPreview,
        uploadedAt: new Date().toISOString(),
        isPrimary,
        displayOrder: startingIndex + idx,
        isUploading: true,
        uploadError: false,
        fileRef: file,
      };
    });

    // INSTANTLY update state so images appear immediately and count updates!
    let currentImages = [...images, ...initialPlaceholders];
    onChange([...currentImages]);

    // 2. Upload each file to Google Cloud Storage
    let successfulCount = 0;
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const placeholder = initialPlaceholders[i];

      try {
        const gcsMeta = await dispatch(uploadGcsMedia(file, "image"));
        successfulCount++;

        // Update the item in currentImages
        currentImages = currentImages.map((img) => {
          if (img.fileId === placeholder.fileId) {
            return {
              ...img,
              fileId: gcsMeta?.fileId || img.fileId,
              fileName: gcsMeta?.fileName || img.fileName,
              storagePath: gcsMeta?.storagePath || img.storagePath,
              publicUrl: gcsMeta?.publicUrl || img.publicUrl,
              bucketName: gcsMeta?.bucketName || "radhakrishnan",
              isUploading: false,
              uploadError: false,
            };
          }
          return img;
        });
        onChange([...currentImages]);
      } catch (err) {
        console.error("GCS Upload Error for file:", file.name, err);
        dispatch(triggerToast(`Failed to upload '${file.name}': ${err.message}`, "error"));

        currentImages = currentImages.map((img) => {
          if (img.fileId === placeholder.fileId) {
            return {
              ...img,
              isUploading: false,
              uploadError: true,
              errorMessage: err.message,
            };
          }
          return img;
        });
        onChange([...currentImages]);
      }
    }

    setUploading(false);
    if (successfulCount > 0) {
      dispatch(triggerToast(`${successfulCount} image(s) uploaded successfully to Google Cloud Storage`, "success"));
    }
  };

  // Retry upload for a failed image
  const retryUpload = async (index) => {
    const target = images[index];
    if (!target || !target.fileRef) return;

    const updated = [...images];
    updated[index] = { ...target, isUploading: true, uploadError: false };
    onChange(updated);

    try {
      const gcsMeta = await dispatch(uploadGcsMedia(target.fileRef, "image"));
      const finalImages = images.map((img, idx) => {
        if (idx === index) {
          return {
            ...img,
            fileId: gcsMeta?.fileId || img.fileId,
            fileName: gcsMeta?.fileName || img.fileName,
            storagePath: gcsMeta?.storagePath || img.storagePath,
            publicUrl: gcsMeta?.publicUrl || img.publicUrl,
            bucketName: gcsMeta?.bucketName || "radhakrishnan",
            isUploading: false,
            uploadError: false,
          };
        }
        return img;
      });
      onChange(finalImages);
      dispatch(triggerToast(`'${target.fileName}' uploaded successfully!`, "success"));
    } catch (err) {
      const finalImages = images.map((img, idx) => {
        if (idx === index) {
          return { ...img, isUploading: false, uploadError: true, errorMessage: err.message };
        }
        return img;
      });
      onChange(finalImages);
      dispatch(triggerToast(`Retry failed: ${err.message}`, "error"));
    }
  };

  // Set primary image
  const setPrimary = (index) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  // Remove image
  const removeImage = (index) => {
    const updated = images.filter((_, idx) => idx !== index);
    // If we removed the primary image, mark the first remaining image as primary
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  // Reorder left/right
  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    // Update display orders
    const reordered = copy.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>Product Images</span>
          </h4>
          <p className="text-xs text-slate-500">
            Upload product photos. The primary image is shown in catalog listings and product cards.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          {images.length} Image(s) Attached
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            await processFiles(Array.from(e.dataTransfer.files));
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer bg-slate-50/50 hover:bg-slate-50 ${
          dragOver ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]" : "border-slate-300"
        }`}
      >
        <input
          type="file"
          id="product-images-input"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label htmlFor="product-images-input" className="cursor-pointer flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-sm font-semibold text-emerald-700 hover:underline">
              Click to select product images
            </span>{" "}
            <span className="text-sm text-slate-500">or drag and drop</span>
          </div>
          <span className="text-xs text-slate-400">Google Cloud Storage (radhakrishnan) Connected</span>
        </label>
      </div>

      {/* Image Gallery Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.fileId || idx}
              className={`relative group rounded-xl border overflow-hidden bg-slate-100 shadow-xs transition-all ${
                img.isPrimary
                  ? "ring-2 ring-emerald-500 border-transparent"
                  : img.uploadError
                  ? "ring-2 ring-rose-400 border-transparent"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Image Container */}
              <div className="aspect-square relative flex items-center justify-center overflow-hidden bg-white">
                <img
                  src={img.previewUrl || img.publicUrl}
                  alt={img.fileName || `Product image ${idx + 1}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    if (img.publicUrl && e.currentTarget.src !== img.publicUrl) {
                      e.currentTarget.src = img.publicUrl;
                    }
                  }}
                />

                {/* Uploading Spinner Overlay */}
                {img.isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-white z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="text-[10px] font-medium tracking-tight">Uploading...</span>
                  </div>
                )}

                {/* Upload Error Overlay */}
                {img.uploadError && !img.isUploading && (
                  <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-2 text-white z-10 text-center">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    <span className="text-[10px] leading-tight text-rose-200">Upload failed</span>
                    {img.fileRef && (
                      <button
                        type="button"
                        onClick={() => retryUpload(idx)}
                        className="px-2 py-1 bg-white text-rose-800 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 shadow-xs"
                      >
                        <RotateCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Primary Badge */}
              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-20">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Primary</span>
                </div>
              )}

              {/* Success Badge if finished and not primary */}
              {!img.isPrimary && !img.isUploading && !img.uploadError && (
                <div className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 z-20">
                  <CheckCircle className="w-3 h-3" />
                  <span>Ready</span>
                </div>
              )}

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-30">
                <div className="flex items-center justify-between">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="p-1.5 bg-white/90 text-slate-800 rounded-lg text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-1 shadow-md"
                      title="Set as Primary Image"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors ml-auto shadow-md"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-black/50 backdrop-blur-xs rounded-lg p-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, -1)}
                    className="p-1 text-white hover:text-emerald-400 disabled:opacity-30"
                    title="Move left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-white font-mono">{idx + 1} / {images.length}</span>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, 1)}
                    className="p-1 text-white hover:text-emerald-400 disabled:opacity-30"
                    title="Move right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
