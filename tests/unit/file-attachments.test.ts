import { strict as assert } from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { write as writeWorkbook, utils as xlsxUtils } from "xlsx";
import {
  AttachmentPreparationError,
  prepareMessagesForModel,
} from "@/lib/ai/file-attachments";

const originalFetch = globalThis.fetch;

function setFetch(body: BodyInit | ArrayBuffer): void {
  globalThis.fetch = async () => new Response(body);
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

test("converts text attachments into bounded text context", async () => {
  setFetch("name,score\nAda,10\n");

  try {
    const [message] = await prepareMessagesForModel([
      {
        id: "message-1",
        parts: [
          {
            mediaType: "text/csv",
            name: "scores.csv",
            type: "file",
            url: "https://blob.example.com/scores.csv",
          },
        ],
        role: "user",
      },
    ]);

    assert.equal(message.parts[0]?.type, "text");
    assert.match(
      String((message.parts[0] as Record<string, unknown>)?.text),
      /scores\.csv/
    );
    assert.match(
      String((message.parts[0] as Record<string, unknown>)?.text),
      /Ada,10/
    );
  } finally {
    restoreFetch();
  }
});

test("extracts DOCX and XLSX attachments", async () => {
  const docx = await readFile(
    "node_modules/mammoth/test/test-data/single-paragraph.docx"
  );
  const workbook = xlsxUtils.book_new();
  xlsxUtils.book_append_sheet(
    workbook,
    xlsxUtils.aoa_to_sheet([
      ["Name", "Score"],
      ["Ada", 10],
    ]),
    "Scores"
  );
  const xlsx = writeWorkbook(workbook, { bookType: "xlsx", type: "buffer" });
  const responses = [docx, xlsx];
  globalThis.fetch = async () => new Response(responses.shift());

  try {
    const [message] = await prepareMessagesForModel([
      {
        id: "message-2",
        parts: [
          {
            mediaType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            name: "notes.docx",
            type: "file",
            url: "https://blob.example.com/notes.docx",
          },
          {
            mediaType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            name: "scores.xlsx",
            type: "file",
            url: "https://blob.example.com/scores.xlsx",
          },
        ],
        role: "user",
      },
    ]);

    assert.equal(message.parts.length, 2);
    assert.match(
      String((message.parts[0] as Record<string, unknown>)?.text),
      /Walking on imported air/
    );
    assert.match(
      String((message.parts[1] as Record<string, unknown>)?.text),
      /Sheet: Scores/
    );
    assert.match(
      String((message.parts[1] as Record<string, unknown>)?.text),
      /Ada,10/
    );
  } finally {
    restoreFetch();
  }
});

test("converts PDF attachments to data-backed file parts and preserves images", async () => {
  setFetch(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]));

  try {
    const [message] = await prepareMessagesForModel([
      {
        id: "message-3",
        parts: [
          {
            mediaType: "application/pdf",
            name: "report.pdf",
            type: "file",
            url: "https://blob.example.com/report.pdf",
          },
          {
            mediaType: "image/png",
            name: "chart.png",
            type: "file",
            url: "https://blob.example.com/chart.png",
          },
        ],
        role: "user",
      },
    ]);

    assert.match(
      String(message.parts[0]?.url),
      /^data:application\/pdf;base64,/
    );
    assert.equal(message.parts[1]?.url, "https://blob.example.com/chart.png");
  } finally {
    restoreFetch();
  }
});

test("reports a readable error when an attachment cannot be fetched", async () => {
  globalThis.fetch = async () => new Response(null, { status: 404 });

  try {
    await assert.rejects(
      prepareMessagesForModel([
        {
          id: "message-4",
          parts: [
            {
              mediaType: "text/plain",
              name: "missing.txt",
              type: "file",
              url: "https://blob.example.com/missing.txt",
            },
          ],
          role: "user",
        },
      ]),
      (error: unknown) =>
        error instanceof AttachmentPreparationError &&
        /missing\.txt/.test(error.message)
    );
  } finally {
    restoreFetch();
  }
});
