// Amounts typed in the admin, in euros. Bulgarian writes the decimal with a
// comma, so a comma directly followed by a digit is a decimal point; values
// are separated by spaces, semicolons or ", ".
export function parseEuroList(input: string): number[] | null {
  const text = input.replace(/€/g, " ").trim().replace(/,(?=\d)/g, ".");
  if (!text) return [];
  const parts = text.split(/[\s;,]+/).filter(Boolean);
  const values = parts.map(Number);
  if (values.some((v) => !Number.isFinite(v) || v <= 0 || v > 100_000)) return null;
  return Array.from(new Set(values.map((v) => Math.round(v * 100) / 100))).sort((a, b) => a - b);
}

export function parseEuro(input: string): number | null | "invalid" {
  const list = parseEuroList(input);
  if (list === null || list.length > 1) return "invalid";
  return list[0] ?? null;
}
