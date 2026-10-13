export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);
}

export function formatHours(hours: number) {
  return `${new Intl.NumberFormat("en-IE", { maximumFractionDigits: 2 }).format(hours)} h`;
}

export function formatPercent(ratio: number) {
  return new Intl.NumberFormat("en-IE", { style: "percent", maximumFractionDigits: 1 }).format(
    ratio,
  );
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}
