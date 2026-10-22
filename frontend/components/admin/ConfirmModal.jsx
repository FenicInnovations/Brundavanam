"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'info'
  isLoading = false,
  isDestructive,
  onConfirm,
  onCancel,
  onClose,
  children,
}) {
  if (!isOpen) return null;

  const handleClose = onCancel || onClose;
  const modalType = isDestructive !== undefined 
    ? (isDestructive ? "danger" : "info") 
    : type;

  const typeStyles = {
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20",
    warning: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20",
    info: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  modalType === "danger"
                    ? "bg-rose-100 text-rose-600"
                    : modalType === "warning"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {children ? (
            <div className="mt-3">{children}</div>
          ) : (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{message}</p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2 text-sm font-medium rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                typeStyles[modalType] || typeStyles.info
              } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
