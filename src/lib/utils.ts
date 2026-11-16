import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Amounts are shown in Indian rupees by default (VITE_CURRENCY can change it, e.g. "USD").
const CURRENCY = import.meta.env.VITE_CURRENCY || "INR";
const moneyFormat = new Intl.NumberFormat(CURRENCY === "INR" ? "en-IN" : undefined, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: unknown): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return moneyFormat.format(Number.isFinite(n) ? n : 0);
}
