// File: src/components/SubmitButton.tsx
"use client"; // Wajib karena menggunakan hook interaktif

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

export function SubmitButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus(); // Mendeteksi apakah form sedang diproses

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}