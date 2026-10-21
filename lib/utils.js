import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes image URLs, adding native support for public Google Drive links.
 * Converts:
 *   - https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
 *   - https://drive.google.com/open?id=<FILE_ID>
 *   - https://drive.google.com/uc?id=<FILE_ID>
 * Into direct Google CDN image streams:
 *   - https://lh3.googleusercontent.com/d/<FILE_ID>
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") {
    return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80";
  }

  const trimmed = url.trim();

  // Detect Google Drive sharing links
  if (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com")) {
    const fileIdMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }

  return trimmed;
}

export function formatDateToYYYYMMDD(date) {
  if (!date) return "";
  const newDate = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  if (isNaN(newDate.getTime())) return "";
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, "0");
  const day = String(newDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatTimeTo12Hour(date) {
  if (!date) return "";
  const newDate = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  if (isNaN(newDate.getTime())) return "";
  let hours = newDate.getHours();
  const minutes = String(newDate.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
