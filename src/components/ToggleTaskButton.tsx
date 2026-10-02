// File: src/components/ToggleTaskButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";

export function ToggleTaskButton({ isCompleted, title }: { isCompleted: boolean; title: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="flex items-center space-x-3 text-left w-full p-1 disabled:opacity-50">
      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300'}`}>
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
        ) : (
          isCompleted && <Check className="h-3 w-3" />
        )}
      </div>
      <span className={`text-sm font-medium leading-none ${isCompleted ? "line-through text-slate-400" : ""}`}>
        {title}
      </span>
    </button>
  );
}