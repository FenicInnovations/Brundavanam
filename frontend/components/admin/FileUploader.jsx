"use client";

import React, { useState } from "react";
import { FileText, Upload, Trash2, ExternalLink, Loader2, Download } from "lucide-react";
import { useDispatch } from "@/lib/redux/store";
import { uploadGcsMedia } from "@/lib/redux/slices/productSlice";
import { triggerToast } from "@/lib/redux/slices/adminSlice";

export default function FileUploader({ files = [], onChange }) {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const updatedFiles = [...files];

    for (const file of selectedFiles) {
      if (file.size > 25 * 1024 * 1024) {
        dispatch(triggerToast(`File '${file.name}' exceeds 25MB limit`, "error"));
        continue;
      }

      try {
        const fileType = file.type === "application/pdf" ? "pdf" : "document";
        const gcsMeta = await dispatch(uploadGcsMedia(file, fileType));

        const fileObj = {
          fileId: gcsMeta.fileId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          fileName: gcsMeta.fileName || file.name,
          fileType,
          mimeType: file.type,
          size: file.size,
          bucketName: gcsMeta.bucketName || "brundavanam-goshala-media",
          storagePath: gcsMeta.storagePath || `documents/${file.name}`,
          publicUrl: gcsMeta.publicUrl || "#",
          uploadedAt: new Date().toISOString(),
        };

        updatedFiles.push(fileObj);
      } catch (err) {
        dispatch(triggerToast(`Failed to upload file '${file.name}': ${err.message}`, "error"));
      }
    }

    setUploading(false);
    onChange(updatedFiles);
    dispatch(triggerToast(`${selectedFiles.length} file(s) attached`, "success"));
  };

  const removeFile = (index) => {
    const updated = files.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Product Files & Documents (PDF / Manuals / Spec Sheets)</span>
          </h4>
          <p className="text-xs text-slate-500">
            Attach lab test reports, user manuals, organic certifications, or ingredient breakdown sheets (PDF / Doc up to 25MB).
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          {files.length} Document(s)
        </span>
      </div>

      {/* Upload button */}
      <div>
        <input
          type="file"
          id="product-files-input"
          multiple
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="product-files-input"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-600" />}
          <span>Upload Document / PDF</span>
        </label>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
          {files.map((file, idx) => (
            <div key={file.fileId || idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 truncate">{file.fileName}</span>
                  <span className="text-[10px] text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • {file.mimeType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.publicUrl && (
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                    title="View Document"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
