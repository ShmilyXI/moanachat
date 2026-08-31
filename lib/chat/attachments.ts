export const SUPPORTED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

export type SupportedAttachmentMediaType =
  (typeof SUPPORTED_ATTACHMENT_MIME_TYPES)[number];

const MEDIA_TYPE_LABELS: Record<SupportedAttachmentMediaType, string> = {
  "application/json": "JSON",
  "application/pdf": "PDF",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "text/csv": "CSV",
  "text/markdown": "MD",
  "text/plain": "TXT",
};

const SUPPORTED_ATTACHMENT_MIME_TYPE_SET = new Set<string>(
  SUPPORTED_ATTACHMENT_MIME_TYPES
);

export function isSupportedAttachmentType(
  value: unknown
): value is SupportedAttachmentMediaType {
  return (
    typeof value === "string" &&
    SUPPORTED_ATTACHMENT_MIME_TYPE_SET.has(value)
  );
}

export function attachmentLabel(name: string, mediaType: string): string {
  const extension = name
    .split(".")
    .at(-1)
    ?.trim()
    .toUpperCase();
  if (extension && extension.length <= 5 && /^[A-Z0-9]+$/.test(extension)) {
    return extension;
  }

  if (isSupportedAttachmentType(mediaType)) {
    return MEDIA_TYPE_LABELS[mediaType];
  }

  return "FILE";
}
