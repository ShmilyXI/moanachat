import { expect, test } from "@playwright/test";

test.describe("Agentic Chat model selector", () => {
  test("sends the selected enabled model", async ({ page }) => {
    let agentBody: Record<string, unknown> | undefined;

    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          capabilities: {
            "anthropic/claude-3.7": {
              reasoning: false,
              tools: true,
              vision: false,
            },
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
            {
              description: "",
              id: "anthropic/claude-3.7",
              name: "Claude 3.7",
              provider: "anthropic",
            },
          ],
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.route("**/api/agent", async (route) => {
      agentBody = route.request().postDataJSON();
      await route.fulfill({ body: "", status: 200 });
    });

    await page.goto("/chat/agent");
    const modelButton = page.getByTestId("model-selector");
    await expect(modelButton).toContainText("GPT 4.1");
    await modelButton.click();
    await page.getByRole("option", { name: /Claude 3\.7/ }).click();
    await expect(modelButton).toContainText("Claude 3.7");

    await page.getByLabel("Ask Moana anything...").fill("Hello agent");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect
      .poll(() => agentBody?.selectedChatModel)
      .toBe("anthropic/claude-3.7");
  });

  test("shows an actionable provider error when the request is rejected", async ({
    page,
  }) => {
    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
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

    await page.route("**/api/agent", async (route) => {
      await route.fulfill({
        body: "The AI provider account has insufficient balance. Recharge the account or choose another enabled model.",
        contentType: "text/plain",
        status: 502,
      });
    });

    await page.goto("/chat/agent");
    await page.getByLabel("Ask Moana anything...").fill("Hello agent");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText(
        "The AI provider account has insufficient balance. Recharge the account or choose another enabled model."
      )
    ).toBeVisible();
  });
});
