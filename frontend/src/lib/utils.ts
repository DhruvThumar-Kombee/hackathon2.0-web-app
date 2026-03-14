import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatError(err: any): string {
  if (typeof err === 'string') return err;
  
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
  }
  
  if (typeof detail === 'string') return detail;
  if (detail) return JSON.stringify(detail);
  
  return err?.message || "An unexpected error occurred";
}
