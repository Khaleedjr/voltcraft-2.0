/**
 * A product name as a URL: "ESP32 Dev Board (Type-C)" → "esp32-dev-board-type-c".
 * Used by the editor to suggest a slug as you type, and by the server when
 * none is given — the same function, so the suggestion is what gets saved.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/°/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
