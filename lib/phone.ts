/**
 * A Nigerian phone number, however it was typed, in the international form
 * WhatsApp links want: "0803 123 4567", "+234 803 123 4567" and
 * "2348031234567" all become "2348031234567". Anything that is not a Nigerian
 * mobile number is passed through as digits.
 */
export function toInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`;
  return digits;
}

export function whatsappLink(phone: string, text?: string): string {
  const base = `https://wa.me/${toInternational(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
