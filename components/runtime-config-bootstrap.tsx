"use client";

import { useEffect, useRef } from "react";

export function RuntimeConfigBootstrap() {
  const hasPosted = useRef(false);

  useEffect(() => {
    if (hasPosted.current) {
      return;
    }

    const url = new URL(window.location.href);
    const baseUrl =
      url.searchParams.get("baseUrl") ?? url.searchParams.get("apiBase");
    const apiKey = url.searchParams.get("apiKey");

    if (!baseUrl || !apiKey) {
      return;
    }

    hasPosted.current = true;

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    fetch(`${basePath}/api/runtime-config`, {
      body: JSON.stringify({ apiKey, baseUrl }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          return;
        }

        // The landing page is now the marketing site, so an embedded New API
        // launch continues into the chat app once its credentials are stored.
        window.location.replace(`${basePath}/chat`);
      })
      .catch(() => {
        // Keep the bootstrap parameters visible for a later page load.
        hasPosted.current = false;
      });
  }, []);

  return null;
}
