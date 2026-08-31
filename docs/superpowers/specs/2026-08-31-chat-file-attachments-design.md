# Chat File Attachments Design

## Goal

Allow the chat composer to accept images and common documents, while keeping
the original attachment visible in the conversation and sending content in a
format supported by the configured New API model.

## Scope

Supported uploads are JPEG, PNG, WebP, PDF, TXT, Markdown, CSV, JSON, DOCX,
XLSX, and XLS. The existing public Blob upload flow remains the storage
boundary. The 5 MB per-file limit remains in place.

The attachment control is no longer a single vision-only gate. It remains
available when model metadata is loading or incomplete. Explicitly unsupported
image input may still be rejected with a readable error; text-extractable
documents do not require visual input capability.

## Data Flow

The browser sends the selected file to `/api/files/upload` and keeps the
returned URL, filename, and media type in the UI message. Chat routes retain
that UI part for persistence and rendering.

Before calling `convertToModelMessages`, the server prepares file parts for the
provider. Images remain image file parts. PDFs are downloaded from the Blob URL
and sent as base64 file data because the OpenAI-compatible provider does not
accept PDF URLs. Plain text, Markdown, CSV, and JSON are decoded into bounded
text blocks. DOCX and XLS/XLSX are converted to bounded text with their
filename and sheet/document context included.

## API and UI Changes

The upload route and chat schemas share one supported-media allowlist. The file
input uses the same allowlist for its `accept` attribute. Attachment previews
show an image thumbnail when possible and a file-type label for documents.

New API model normalization reads visual capability metadata from the known
New API fields. Missing capability metadata is represented as unknown rather
than as an explicit negative, so it cannot disable the entire attachment
control.

Provider or extraction failures return a specific user-facing error and do not
silently claim that a file was processed.

## Testing

Unit tests cover media-type validation, document text preparation, PDF data
conversion, and unknown-versus-explicitly-unsupported vision capability. An
end-to-end test verifies that the attachment button is enabled for a configured
model with incomplete capability metadata and that a supported file can be
selected.
