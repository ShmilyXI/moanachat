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
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
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

function toBase64(data: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x80_00;
  for (let index = 0; index < data.length; index += chunkSize) {
    binary += String.fromCharCode(...data.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function isSupportedAttachmentType(
  value: unknown
): value is SupportedAttachmentMediaType {
  return (
    typeof value === "string" && SUPPORTED_ATTACHMENT_MIME_TYPE_SET.has(value)
  );
}

export function canUploadAttachments(status: string): boolean {
  return status !== "submitted" && status !== "streaming";
}

export function buildInlineAttachment({
  contentType,
  data,
  filename,
}: {
  contentType: string;
  data: Uint8Array;
  filename: string;
}) {
  const pathname = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return {
    contentType,
    pathname,
    url: `data:${contentType};base64,${toBase64(data)}`,
  };
}

export function attachmentLabel(name: string, mediaType: string): string {
  const extension = name.split(".").at(-1)?.trim().toUpperCase();
  const isGenericName = name.trim().toLowerCase() === "file";
  if (
    !isGenericName &&
    extension &&
    extension.length <= 5 &&
    /^[A-Z0-9]+$/.test(extension)
  ) {
    return extension;
  }

  if (isSupportedAttachmentType(mediaType)) {
    return MEDIA_TYPE_LABELS[mediaType];
  }

  return "FILE";
}
