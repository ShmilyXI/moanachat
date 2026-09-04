import { expect, test } from "@playwright/test";

test.describe("Model Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("displays a model button", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await expect(modelButton).toBeVisible();
  });

  test("opens model selector popover on click", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    await expect(page.getByPlaceholder("Search models...")).toBeVisible();
  });

  test("can search for models", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    const searchInput = page.getByPlaceholder("Search models...");
    await searchInput.fill("DeepSeek");

    await expect(
      page.getByRole("option", { name: /DeepSeek V3\.2/ })
    ).toBeVisible();
  });

  test("can close model selector by clicking outside", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    await expect(page.getByPlaceholder("Search models...")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByPlaceholder("Search models...")).not.toBeVisible();
  });

  test("shows available models", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    const availableModels = page.getByRole("group", { name: "Available" });
    await expect(availableModels).toBeVisible();
    await expect(
      availableModels.getByRole("option", { name: /DeepSeek V3\.2/ })
    ).toBeVisible();
    await expect(
      availableModels.getByRole("option", { name: /Kimi K2\.5/ })
    ).toBeVisible();
  });

  test("can select a different model", async ({ page }) => {
    const modelButton = page.getByTestId("model-selector");
    await modelButton.click();

    await page.getByRole("option", { name: /DeepSeek V3\.2/ }).click();

    await expect(page.getByPlaceholder("Search models...")).not.toBeVisible();
    await expect(modelButton).toContainText("DeepSeek V3.2");
  });

  test("keeps the standalone capability response shape", async ({ page }) => {
    const response = await page.request.get("/api/models");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["cache-control"]).toBe("private, no-store");

    const payload = await response.json();
    const capabilities = payload.capabilities ?? payload;
    expect(Object.hasOwn(capabilities, "moonshotai/kimi-k2.5")).toBeTruthy();
  });

  test("keeps attachments available when vision metadata is missing", async ({
    page,
  }) => {
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

    await page.goto("/chat");
    await expect(page.getByTestId("attachments-button")).toBeEnabled();
  });

  test("refreshes models after the runtime configuration changes", async ({
    page,
  }) => {
    let useEmbeddedModels = false;
    let modelRequestCount = 0;

    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        if (url.includes("/api/models")) {
          const state = window as unknown as {
            __modelFetchCaches?: Array<RequestCache | null>;
          };
          state.__modelFetchCaches ??= [];
          state.__modelFetchCaches.push(init?.cache ?? null);
        }
        return originalFetch(input, init);
      };
    });

    await page.route("**/api/models", async (route) => {
      modelRequestCount += 1;
      if (!useEmbeddedModels) {
        await route.fulfill({
          body: JSON.stringify({
            capabilities: {
              "openai/gpt-oss-20b": {
                reasoning: true,
                tools: true,
                vision: false,
              },
            },
          }),
          contentType: "application/json",
          status: 200,
        });
        return;
      }

      await route.fulfill({
        body: JSON.stringify({
          capabilities: {
            "gpt-5.6-sol": {
              reasoning: true,
              tools: true,
              vision: false,
            },
          },
          defaultModelId: "gpt-5.6-sol",
          mode: "embedded",
          models: [
            {
              description: "",
              id: "gpt-5.6-sol",
              name: "GPT 5.6 Sol",
              provider: "openai",
            },
          ],
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/chat");
    const modelButton = page.getByTestId("model-selector");
    await expect.poll(() => modelRequestCount).toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    const initialModelRequestCount = modelRequestCount;
    await expect(modelButton).not.toContainText("GPT 5.6 Sol");

    useEmbeddedModels = true;
    await page.evaluate(() => {
      window.dispatchEvent(new Event("moana-runtime-config-ready"));
    });

    await expect
      .poll(() => modelRequestCount)
      .toBeGreaterThan(initialModelRequestCount);
    const modelFetchCaches = await page.evaluate(
      () =>
        (
          window as unknown as {
            __modelFetchCaches?: Array<RequestCache | null>;
          }
        ).__modelFetchCaches ?? []
    );
    expect(modelFetchCaches.length).toBeGreaterThan(0);
    expect(
      modelFetchCaches.every((cache) => cache === "no-store")
    ).toBeTruthy();
    await expect(modelButton).toContainText("GPT 5.6 Sol");
  });
});
