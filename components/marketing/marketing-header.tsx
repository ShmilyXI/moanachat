"use client";

import { ArrowUp, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { saveDemoPrompt } from "./composer";

const links = [
  { href: "#models", label: "About" },
  { href: "#capabilities", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#developers", label: "Resources" },
];

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState("");

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".marketing-home");
    const onScroll = () =>
      setScrolled((container?.scrollTop ?? 0) > window.innerHeight * 0.7);
    onScroll();
    container?.addEventListener("scroll", onScroll, { passive: true });
    return () => container?.removeEventListener("scroll", onScroll);
  }, []);

  const submitQuickPrompt = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const prompt = quickPrompt.trim();
      if (!prompt) {
        return;
      }
      saveDemoPrompt(prompt);
    },
    [quickPrompt]
  );
  const handleQuickPromptChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuickPrompt(event.target.value);
    },
    []
  );

  return (
    <header
      className="marketing-header"
      data-marketing-nav
      data-state={scrolled ? "scrolled" : "resting"}
    >
      <div className="marketing-header__inner">
        <div className="marketing-header__brand">
          <a className="marketing-wordmark" href="/">
            Moana
          </a>
          {scrolled ? (
            <form
              className="marketing-mini-composer"
              data-mini-composer
              onSubmit={submitQuickPrompt}
            >
              <span aria-hidden className="marketing-mini-composer__mark">
                ⌘
              </span>
              <input
                aria-label="Quick chat input"
                className="marketing-mini-composer__input"
                onChange={handleQuickPromptChange}
                placeholder="Ask anything privately..."
                value={quickPrompt}
              />
              <button
                aria-label="Send quick prompt"
                className="marketing-mini-composer__send"
                disabled={!quickPrompt.trim()}
                type="submit"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </form>
          ) : null}
        </div>
        <nav className="marketing-header__nav">
          {links.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
              {link.label === "Resources" ? (
                <ChevronDown aria-hidden className="size-3" />
              ) : null}
            </a>
          ))}
        </nav>
        <div className="marketing-header__actions">
          <a className="marketing-header__login" href="/login">
            Log in
          </a>
          <a className="marketing-header__signup" href="/sign-up">
            Sign up
          </a>
        </div>
      </div>
    </header>
  );
}
