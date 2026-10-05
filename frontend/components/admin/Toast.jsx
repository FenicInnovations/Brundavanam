"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useSelector, useDispatch, selectAdminToast } from "@/lib/redux/store";
import { adminSliceActions } from "@/lib/redux/slices/adminSlice";

export default function Toast() {
  const toast = useSelector(selectAdminToast);
  const dispatch = useDispatch();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />,
  };

  const borders = {
    success: "border-emerald-200 bg-emerald-50/90 text-emerald-900",
    error: "border-rose-200 bg-rose-50/90 text-rose-900",
    warning: "border-amber-200 bg-amber-50/90 text-amber-900",
    info: "border-sky-200 bg-sky-50/90 text-sky-900",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-md ${
          borders[toast.type] || borders.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <span className="text-sm font-medium pr-2">{toast.message}</span>
        <button
          onClick={() => dispatch({ type: adminSliceActions.HIDE_TOAST })}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors ml-auto"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
