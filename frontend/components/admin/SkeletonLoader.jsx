"use client";

import React from "react";

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-3 w-1/4 bg-slate-100 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-20 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse" />
            <div className="w-9 h-9 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="h-8 w-16 bg-slate-300 rounded-md animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-28 w-full bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
