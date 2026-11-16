import { base44 } from "@/api/base44Client";

export async function uploadPrivate(file) {
  const result = await base44.integrations.Core.UploadPrivateFile({ file });
  return result.file_uri;
}

export async function openPrivate(uri) {
  if (!uri) return;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 900 });
  window.open(signed_url, "_blank", "noopener,noreferrer");
}

export function downloadCsv(filename, header, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}