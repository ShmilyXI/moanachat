import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  attachmentLabel,
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
  assert.equal(attachmentLabel("report.docx", "application/octet-stream"), "DOCX");
  assert.equal(attachmentLabel("unknown", "application/pdf"), "PDF");
});
