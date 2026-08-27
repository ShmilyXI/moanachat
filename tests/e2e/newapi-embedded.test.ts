import { expect, test } from "@playwright/test";

test.describe("New API embedded mode", () => {
  test("bootstraps the runtime config and uses discovered models", async ({
    page,
  }) => {
    let runtimeConfigBody: Record<string, string> | undefined;
    let chatBody: Record<string, unknown> | undefined;

    await page.route("**/api/runtime-config", async (route) => {
      runtimeConfigBody = route.request().postDataJSON();
      await route.fulfill({
        body: JSON.stringify({ mode: "embedded", success: true }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          capabilities: {
            "openai/gpt-4.1": {
              reasoning: false,
              tools: true,
              vision: false,
            },
          },
          defaultModelId: "openai/gpt-4.1",
          mode: "embedded",
          models: [
            {
              description: "",
              id: "openai/gpt-4.1",
              name: "GPT 4.1",
              provider: "openai",
            },
          ],
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.route("**/api/chat", async (route) => {
      chatBody = route.request().postDataJSON();
      await route.fulfill({
        body: "",
        contentType: "text/plain",
        status: 200,
      });
    });

    await page.goto(
      "/?baseUrl=http%3A%2F%2Fnewapi.test&apiKey=sk-test-embedded"
    );

    await expect
      .poll(() => runtimeConfigBody)
      .toEqual({
        apiKey: "sk-test-embedded",
        baseUrl: "http://newapi.test",
      });
    await expect.poll(() => page.url()).not.toContain("apiKey");
    await expect.poll(() => page.url()).not.toContain("baseUrl");

    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();
    await expect(page.getByRole("option", { name: /GPT 4\.1/ })).toBeVisible();
    await page.getByRole("option", { name: /GPT 4\.1/ }).click();
    await expect(modelButton).toContainText("GPT 4.1");

    await page.getByTestId("multimodal-input").fill("Hello embedded");
    await page.getByTestId("send-button").click();
    await expect.poll(() => chatBody?.selectedChatModel).toBe("openai/gpt-4.1");
  });
});
