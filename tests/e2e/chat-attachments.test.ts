import { expect, test } from "@playwright/test";

test("selects and sends image and PDF attachments", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;

  await page.route("**/api/models", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        capabilities: {
          "moonshotai/kimi-k2.5": {
            reasoning: false,
            tools: false,
          },
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.route("**/api/chat", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      body: "",
      contentType: "text/event-stream",
      status: 200,
    });
  });

  await page.goto("/");
  const attachmentButton = page.getByTestId("attachments-button");
  await expect(attachmentButton).toBeEnabled();

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles([
    {
      buffer: Buffer.from("%PDF-1.7"),
      mimeType: "application/pdf",
      name: "report.pdf",
    },
    {
      buffer: Buffer.from("fake-png"),
      mimeType: "image/png",
      name: "chart.png",
    },
  ]);

  await expect(page.getByTestId("attachments-preview")).toBeVisible();
  await expect(page.getByTestId("input-attachment-preview")).toHaveCount(2);

  await page.getByTestId("multimodal-input").fill("请分析附件");
  await page.getByTestId("send-button").click();

  await expect.poll(() => requestBody).toBeTruthy();
  const message = requestBody?.message as {
    parts?: Array<{ mediaType?: string; type?: string }>;
  };
  expect(message.parts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ mediaType: "application/pdf", type: "file" }),
      expect.objectContaining({ mediaType: "image/png", type: "file" }),
    ])
  );
});
