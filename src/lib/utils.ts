import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency for amounts. An admin sets it in the app (see useAppConfig); VITE_CURRENCY is only the starting default.
let currency = import.meta.env.VITE_CURRENCY || "INR";
const formatters: Record<string, Intl.NumberFormat> = {};

const formatterFor = (code: string, decimals: number) => {
  const key = `${code}:${decimals}`;
  if (!formatters[key]) {
    formatters[key] = new Intl.NumberFormat(code === "INR" ? "en-IN" : undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return formatters[key];
};

export function setCurrency(code: string) {
  try {
    formatterFor(code, 2); // throws for an unknown code
    currency = code;
  } catch {
    /* keep the previous currency */
  }
}

export const getCurrency = () => currency;

const toNumber = (value: unknown) => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function formatMoney(value: unknown): string {
  return formatterFor(currency, 2).format(toNumber(value));
}

// Prices: no decimals for whole amounts (₹199), two otherwise ($4.99).
export function formatPrice(value: unknown): string {
  const n = toNumber(value);
  return formatterFor(currency, Number.isInteger(n) ? 0 : 2).format(n);
}
