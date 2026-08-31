import mammoth from "mammoth";
import { read as readWorkbook, utils as xlsxUtils } from "xlsx";
import { isSupportedAttachmentType } from "@/lib/chat/attachments";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_EXTRACTED_TEXT_LENGTH = 20_000;

type FilePart = {
  filename?: string;
  mediaType?: unknown;
  name?: string;
  type?: unknown;
  url?: unknown;
  [key: string]: unknown;
};

export class AttachmentPreparationError extends Error {
  constructor(filename: string, reason: string) {
    super(`Unable to process attachment "${filename}": ${reason}`);
    this.name = "AttachmentPreparationError";
  }
}

function isFilePart(value: unknown): value is FilePart {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const part = value as FilePart;
  return part.type === "file" && typeof part.url === "string";
}

function getFilename(part: FilePart): string {
  const filename =
    typeof part.filename === "string" && part.filename.trim()
      ? part.filename.trim()
      : typeof part.name === "string" && part.name.trim()
        ? part.name.trim()
        : "attachment";
  return filename.slice(0, 100);
}

function decodeDataUrl(url: string): Uint8Array | undefined {
  const match = url.match(/^data:[^;,]+;base64,(.*)$/s);
  return match ? Uint8Array.from(Buffer.from(match[1], "base64")) : undefined;
}

async function downloadAttachment(url: string): Promise<Uint8Array> {
  const data = decodeDataUrl(url);
  if (data) {
    if (data.byteLength > MAX_ATTACHMENT_BYTES) {
      throw new Error("file is larger than 5 MB");
    }
    return data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`file server returned ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new Error("file is larger than 5 MB");
  }
  return bytes;
}

function clipText(value: string): string {
  const normalized = value.split(String.fromCharCode(0)).join("").trim();
  if (normalized.length <= MAX_EXTRACTED_TEXT_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_EXTRACTED_TEXT_LENGTH)}\n[Content truncated]`;
}

function textPart(filename: string, value: string): FilePart {
  const contents = clipText(value) || "(empty file)";
  return {
    text: `Contents of ${filename}:\n${contents}`,
    type: "text",
  };
}

async function extractDocumentText(
  mediaType: string,
  filename: string,
  bytes: Uint8Array
): Promise<FilePart> {
  const buffer = Buffer.from(bytes);

  if (
    mediaType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return textPart(filename, result.value);
  }

  if (
    mediaType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mediaType === "application/vnd.ms-excel"
  ) {
    const workbook = readWorkbook(buffer, { type: "buffer" });
    const text = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `Sheet: ${sheetName}\n${xlsxUtils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
    return textPart(filename, text);
  }

  return textPart(filename, new TextDecoder().decode(bytes));
}

async function prepareFilePart(part: FilePart): Promise<FilePart> {
  const filename = getFilename(part);
  const mediaType =
    typeof part.mediaType === "string" ? part.mediaType : undefined;
  const url = typeof part.url === "string" ? part.url : undefined;

  if (!mediaType || !isSupportedAttachmentType(mediaType)) {
    throw new AttachmentPreparationError(filename, "unsupported file type");
  }
  if (!url) {
    throw new AttachmentPreparationError(filename, "file URL is missing");
  }

  try {
    const normalizedPart = {
      ...part,
      filename: part.filename ?? filename,
    };

    if (mediaType.startsWith("image/")) {
      return normalizedPart;
    }

    const bytes = await downloadAttachment(url);

    if (mediaType === "application/pdf") {
      return {
        ...normalizedPart,
        url: `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`,
      };
    }

    return extractDocumentText(mediaType, filename, bytes);
  } catch (error) {
    if (error instanceof AttachmentPreparationError) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : "unknown error";
    const preparationError = new AttachmentPreparationError(filename, reason);
    preparationError.cause = error;
    throw preparationError;
  }
}

export function prepareMessagesForModel<
  T extends { parts: readonly unknown[] },
>(messages: readonly T[]): Promise<T[]> {
  return Promise.all(
    messages.map(async (message) => {
      const parts = (
        await Promise.all(
          message.parts.map(async (part) =>
            isFilePart(part) ? prepareFilePart(part) : part
          )
        )
      ).flat();

      return { ...message, parts } as T;
    })
  );
}
