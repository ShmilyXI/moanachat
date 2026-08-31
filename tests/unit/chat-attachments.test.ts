import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  attachmentLabel,
  buildInlineAttachment,
  isSupportedAttachmentType,
  SUPPORTED_ATTACHMENT_MIME_TYPES,
} from "@/lib/chat/attachments";

test("accepts the supported image and document media types", () => {
  for (const mediaType of SUPPORTED_ATTACHMENT_MIME_TYPES) {
    assert.equal(isSupportedAttachmentType(mediaType), true, mediaType);
  }

  assert.equal(isSupportedAttachmentType("application/x-msdownload"), false);
  assert.equal(isSupportedAttachmentType(undefined), false);
});

test("labels attachments with a useful file type", () => {
  assert.equal(attachmentLabel("notes.md", "text/markdown"), "MD");
  assert.equal(
    attachmentLabel("report.docx", "application/octet-stream"),
    "DOCX"
  );
  assert.equal(attachmentLabel("unknown", "application/pdf"), "PDF");
});

test("builds an inline attachment when external blob storage is unavailable", () => {
  assert.deepEqual(
    buildInlineAttachment({
      contentType: "text/plain",
      data: new Uint8Array([72, 105]),
      filename: "notes.txt",
    }),
    {
      contentType: "text/plain",
      pathname: "notes.txt",
      url: "data:text/plain;base64,SGk=",
    }
  );
});
