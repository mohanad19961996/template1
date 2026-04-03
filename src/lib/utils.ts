import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, locale = "ar-SA-u-nu-latn", currency = "SAR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(price);
}

export function formatDate(date: Date | string, locale = "ar-SA-u-nu-latn") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
