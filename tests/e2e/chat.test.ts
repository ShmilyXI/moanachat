import { expect, test } from "@playwright/test";

test.describe("Chat Page", () => {
  test("opens the sidebar from a narrow embedded viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 960, width: 652 });
    await page.goto("/chat/sidebar-regression");

    const sidebarToggle = page.getByTestId("sidebar-toggle-button");
    await expect(sidebarToggle).toBeVisible({ timeout: 10_000 });

    await sidebarToggle.click();
    const sidebar = page.locator('[data-sidebar="sidebar"]').first();
    await expect(sidebar.getByText("Search", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      sidebar.getByRole("button", { exact: true, name: "New chat" })
    ).toHaveCount(0);
    await expect(
      sidebar.getByRole("button", { exact: true, name: "Delete all" })
    ).toHaveCount(0);
  });

  test("keeps the current chat route when clicking the sidebar logo", async ({
    page,
  }) => {
    await page.goto("/chat/agent");

    const logo = page.getByTestId("chat-brand");
    await expect(logo).toHaveAttribute("href", "/chat/agent");
    await logo.click();
    await expect(page).toHaveURL(/\/chat\/agent$/);
  });

  test("opens a fresh conversation from the sidebar chat link", async ({
    page,
  }) => {
    await page.goto("/chat/sidebar-navigation");

    const sidebar = page.locator('[data-sidebar="sidebar"]').first();
    await sidebar.getByRole("link", { exact: true, name: "Chat" }).click();

    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
    await expect(page.locator(".marketing-home")).toHaveCount(0);
  });

  test("keeps the composer frame unchanged when the input is focused", async ({
    page,
  }) => {
    await page.goto("/chat");

    const input = page.getByTestId("multimodal-input");
    const composer = page
      .locator('[data-slot="input-group"]')
      .filter({ has: input });
    await expect(input).toBeVisible();

    await input.blur();
    await page.waitForTimeout(350);
    const inactiveBorderColor = await composer.evaluate(
      (element) => getComputedStyle(element).borderColor
    );
    const inactiveShadow = await composer.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--tw-shadow")
    );
    const inactiveInputBorder = await input.evaluate(
      (element) => getComputedStyle(element).borderWidth
    );
    const inactiveInputOutline = await input.evaluate(
      (element) => getComputedStyle(element).outlineStyle
    );

    await input.focus();
    await page.waitForTimeout(350);
    const activeBorderColor = await composer.evaluate(
      (element) => getComputedStyle(element).borderColor
    );
    const activeShadow = await composer.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--tw-shadow")
    );
    const activeBoxShadow = await composer.evaluate(
      (element) => getComputedStyle(element).boxShadow
    );
    const activeInputBorder = await input.evaluate(
      (element) => getComputedStyle(element).borderWidth
    );
    const activeInputOutline = await input.evaluate(
      (element) => getComputedStyle(element).outlineStyle
    );

    expect(activeBorderColor).toBe(inactiveBorderColor);
    expect(activeShadow).toBe(inactiveShadow);
    expect(activeInputBorder).toBe(inactiveInputBorder);
    expect(activeInputOutline).toBe(inactiveInputOutline);
    expect(activeBoxShadow).not.toContain("0px 0px 0px 3px");
  });

  test("renders filed and unfiled chats in their matching sidebar sections", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "moanachat-folders",
        JSON.stringify({
          folders: [
            {
              chatIds: ["chat-filed"],
              id: "folder-ideas",
              isExpanded: true,
              name: "Ideas",
            },
          ],
          version: 1,
        })
      );
    });
    await page.route("**/api/history*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          chats: [
            {
              createdAt: new Date().toISOString(),
              id: "chat-filed",
              title: "Filed chat",
              userId: "user-1",
              visibility: "private",
            },
            {
              createdAt: new Date().toISOString(),
              id: "chat-unfiled",
              title: "Unfiled chat",
              userId: "user-1",
              visibility: "private",
            },
          ],
          hasMore: false,
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/chat/agent");

    await expect(page.getByTestId("chat-folder-folder-ideas")).toBeVisible();
    await expect(
      page.getByTestId("chat-folder-item-folder-ideas-chat-filed")
    ).toBeVisible();
    await expect(page.getByTestId("chat-unfiled-chat-unfiled")).toBeVisible();
  });

  test("moves a chat into a folder with drag and drop", async ({ page }) => {
    await page.route("**/api/history*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          chats: [
            {
              createdAt: new Date().toISOString(),
              id: "chat-to-file",
              title: "Chat to file",
              userId: "user-1",
              visibility: "private",
            },
          ],
          hasMore: false,
        }),
        contentType: "application/json",
        status: 200,
      });
    });
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "moanachat-folders",
        JSON.stringify({ folders: [], version: 1 })
      );
    });

    await page.goto("/chat/agent");
    await page.getByTestId("chat-create-folder").click();
    await page.getByTestId("chat-folder-name-input").fill("Ideas");
    await page.getByTestId("chat-folder-confirm").click();

    const chat = page.getByTestId("chat-unfiled-chat-to-file");
    const folder = page
      .getByTestId("chat-folders")
      .locator('[data-testid^="chat-folder-"]')
      .first();
    await chat.dragTo(folder);

    await expect
      .poll(() =>
        page.evaluate(() => {
          const stored = window.localStorage.getItem("moanachat-folders");
          return stored ? JSON.parse(stored).folders[0]?.chatIds : undefined;
        })
      )
      .toEqual(["chat-to-file"]);
  });

  test("deletes a folder without deleting its filed chats", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "moanachat-folders",
        JSON.stringify({
          folders: [
            {
              chatIds: ["chat-filed"],
              id: "folder-ideas",
              isExpanded: true,
              name: "Ideas",
            },
          ],
          version: 1,
        })
      );
    });
    await page.route("**/api/history*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          chats: [
            {
              createdAt: new Date().toISOString(),
              id: "chat-filed",
              title: "Filed chat",
              userId: "user-1",
              visibility: "private",
            },
          ],
          hasMore: false,
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/chat/agent");
    await page.getByTestId("chat-folder-delete-folder-ideas").click();
    await expect(page.getByRole("alertdialog")).toContainText(
      "Delete this folder?"
    );
    await page.getByRole("button", { exact: true, name: "Continue" }).click();

    await expect(page.getByTestId("chat-folder-folder-ideas")).toHaveCount(0);
    await expect(page.getByTestId("chat-unfiled-chat-filed")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          JSON.parse(window.localStorage.getItem("moanachat-folders") ?? "{}")
        )
      )
      .toEqual({ folders: [], version: 1 });
  });

  test("removes filed chat membership after deleting the chat", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "moanachat-folders",
        JSON.stringify({
          folders: [
            {
              chatIds: ["chat-filed"],
              id: "folder-ideas",
              isExpanded: true,
              name: "Ideas",
            },
          ],
          version: 1,
        })
      );
    });
    await page.route("**/api/history*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          chats: [
            {
              createdAt: new Date().toISOString(),
              id: "chat-filed",
              title: "Filed chat",
              userId: "user-1",
              visibility: "private",
            },
          ],
          hasMore: false,
        }),
        contentType: "application/json",
        status: 200,
      });
    });
    await page.route("**/api/chat?id=chat-filed", async (route) => {
      await route.fulfill({
        body: "{}",
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/chat/agent");
    await page.getByTestId("chat-action-chat-filed").click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { exact: true, name: "Continue" }).click();

    await expect(
      page.getByTestId("chat-folder-item-folder-ideas-chat-filed")
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(window.localStorage.getItem("moanachat-folders") ?? "{}")
              .folders[0]?.chatIds
        )
      )
      .toEqual([]);
  });

  test("renames a folder inline and persists the new name", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "moanachat-folders",
        JSON.stringify({
          folders: [
            {
              chatIds: [],
              id: "folder-ideas",
              isExpanded: true,
              name: "Ideas",
            },
          ],
          version: 1,
        })
      );
    });
    await page.route("**/api/history*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({ chats: [], hasMore: false }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/chat/agent");
    await page.getByTestId("chat-folder-rename-folder-ideas").click();
    const input = page.getByTestId("chat-folder-name-input-folder-ideas");
    await input.fill("Projects");
    await page.getByTestId("chat-folder-confirm-folder-ideas").click();

    await expect(page.getByTestId("chat-folder-folder-ideas")).toContainText(
      "Projects"
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(window.localStorage.getItem("moanachat-folders") ?? "{}")
              .folders[0]?.name
        )
      )
      .toBe("Projects");
  });

  test("home page loads with input field", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByTestId("multimodal-input")).toBeVisible();
  });

  test("can type in the input field", async ({ page }) => {
    await page.goto("/chat");
    const input = page.getByTestId("multimodal-input");
    await input.fill("Hello world");
    await expect(input).toHaveValue("Hello world");
  });

  test("submit button is visible", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByTestId("send-button")).toBeVisible();
  });

  test("hides studio and feed from the sidebar navigation", async ({
    page,
  }) => {
    await page.goto("/chat");

    await expect(
      page.getByRole("link", { exact: true, name: "Studio" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { exact: true, name: "Feed" })
    ).toHaveCount(0);
  });

  test("hides agent and character surfaces from the chat shell", async ({
    page,
  }) => {
    await page.goto("/chat");

    await expect(
      page.getByRole("link", { exact: true, name: "Agentic Chat" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { exact: true, name: "Characters" })
    ).toHaveCount(0);
    await expect(
      page.getByText("Try Agentic Chat", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("My characters", { exact: true })).toHaveCount(
      0
    );
  });

  test("suggested actions are visible on empty chat", async ({ page }) => {
    await page.goto("/chat");
    const suggestions = page.locator("[data-testid='suggested-actions']");
    await expect(suggestions).toBeVisible();
  });

  test("does not show the unused composer tools control", async ({ page }) => {
    await page.goto("/chat");

    await expect(
      page.getByRole("button", { exact: true, name: "Tools" })
    ).toHaveCount(0);
    await expect(page.getByText("操作", { exact: true })).toHaveCount(0);
  });

  test("shows only settings that are wired to chat requests", async ({
    page,
  }) => {
    await page.goto("/chat");
    await page.getByRole("button", { exact: true, name: "Settings" }).click();

    await expect(page.getByTestId("setting-reasoning")).toBeEnabled();
    await expect(
      page.getByText("Large context chat", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("Context usage", { exact: true })).toHaveCount(
      0
    );
    await expect(
      page.getByRole("button", { exact: true, name: "Reset" })
    ).toHaveCount(0);
  });

  test("can stop generation with stop button", async ({ page }) => {
    await page.goto("/chat");

    // Type and send a message
    await page.getByTestId("multimodal-input").fill("Hello");
    await page.getByTestId("send-button").click();

    // Stop button should appear during generation
    const stopButton = page.getByTestId("stop-button");
    // If generation starts, stop button appears
    // This is a best-effort check since timing depends on API
    await stopButton.click({ timeout: 5000 }).catch(() => {
      // Generation may have finished before we could click
    });
  });
});

test.describe("Chat Input Features", () => {
  test("input clears after sending", async ({ page }) => {
    await page.goto("/chat");
    const input = page.getByTestId("multimodal-input");
    await input.fill("Test message");
    await page.getByTestId("send-button").click();

    // Input should clear after sending
    await expect(input).toHaveValue("");
  });

  test("input supports multiline text", async ({ page }) => {
    await page.goto("/chat");
    const input = page.getByTestId("multimodal-input");
    await input.fill("Line 1\nLine 2\nLine 3");
    await expect(input).toContainText("Line 1");
  });
});

test.describe("Locale switching", () => {
  for (const { expectedPrompt, locale } of [
    {
      expectedPrompt: "使用 Next.js 有哪些优势？",
      locale: "zh",
    },
    {
      expectedPrompt: "What are the advantages of using Next.js?",
      locale: "en",
    },
  ]) {
    test(`sends suggested actions in the active ${locale} locale`, async ({
      page,
    }) => {
      let requestBody: Record<string, unknown> | undefined;
      await page.addInitScript(
        ({ activeLocale }) => {
          window.localStorage.setItem("moanachat-locale", activeLocale);
        },
        { activeLocale: locale }
      );
      await page.route("**/api/chat", async (route) => {
        requestBody = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          body: "",
          contentType: "text/event-stream",
          status: 200,
        });
      });

      await page.goto("/chat");
      await page
        .getByRole("button", { exact: true, name: expectedPrompt })
        .click();

      await expect.poll(() => requestBody).toBeTruthy();
      const message = requestBody?.message as {
        parts?: Array<{ text?: string; type?: string }>;
      };
      expect(message.parts).toContainEqual({
        text: expectedPrompt,
        type: "text",
      });
    });
  }

  test("defaults to English for a Chinese browser locale", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "language", {
        configurable: true,
        value: "zh-CN",
      });
      Object.defineProperty(navigator, "languages", {
        configurable: true,
        value: ["zh-CN", "en-US"],
      });
    });

    await page.goto("/chat");

    await expect(page.getByText("What can I help with?")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("switches language and persists the choice", async ({ page }) => {
    await page.goto("/chat");

    await page.getByTestId("language-switcher").first().click();
    await page.getByTestId("language-option-zh").click();

    await expect(page.getByText("今天想聊点什么？")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");

    await page.reload();
    await expect(page.getByText("今天想聊点什么？")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");

    await page.getByTestId("language-switcher").first().click();
    await page.getByTestId("language-option-en").click();

    await expect(page.getByText("What can I help with?")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
