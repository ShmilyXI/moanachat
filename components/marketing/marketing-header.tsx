"use client";

import { ArrowUp, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { saveDemoPrompt } from "./composer";
import { MoanaMark } from "./moana-mark";

const links = [
  { href: "#models", label: "About" },
  { href: "#capabilities", label: "Features" },
  { href: "#models", label: "Token", menu: ["VVV", "DIEM"] },
  { href: "#pricing", label: "Pricing" },
  {
    href: "#developers",
    label: "Resources",
    menu: ["API + Docs", "FAQs", "Privacy", "Blog", "Media", "Careers"],
  },
  { href: "#developers", label: "Store" },
];

const mobileGroups = [
  {
    links: [
      { href: "#models", label: "About" },
      { href: "#capabilities", label: "Features" },
    ],
  },
  {
    label: "Token",
    links: [
      { href: "#models", label: "VVV" },
      { href: "#models", label: "DIEM" },
    ],
  },
  {
    links: [{ href: "#pricing", label: "Pricing" }],
  },
  {
    label: "Resources",
    links: [
      { href: "#developers", label: "API + Docs" },
      { href: "#developers", label: "FAQs" },
      { href: "#privacy", label: "Privacy" },
      { href: "#developers", label: "Blog" },
      { href: "#developers", label: "Media" },
      { href: "#developers", label: "Careers" },
      { href: "#developers", label: "Brand Kit" },
      { href: "#developers", label: "Changelog" },
      { href: "#developers", label: "Download" },
      { href: "#developers", label: "Status Page" },
      { href: "#developers", label: "Store" },
    ],
  },
];

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState("");

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".marketing-home");
    const onScroll = () =>
      setScrolled((container?.scrollTop ?? 0) > window.innerHeight * 0.7);
    onScroll();
    container?.addEventListener("scroll", onScroll, { passive: true });
    return () => container?.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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
              <MoanaMark className="marketing-mini-composer__mark" />
              <input
                aria-label="Quick chat input"
                className="marketing-mini-composer__input"
                onChange={handleQuickPromptChange}
                placeholder="Ask anything..."
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
              {link.menu ? (
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
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={`marketing-header__menu-button ${menuOpen ? "is-open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            title={menuOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            <span aria-hidden />
            <span aria-hidden />
          </button>
        </div>
        {menuOpen ? (
          <div className="marketing-header__mobile-menu" data-mobile-menu>
            {mobileGroups.map((group) => (
              <div className="marketing-header__mobile-group" key={group.label ?? "primary"}>
                {group.label ? (
                  <p className="marketing-header__mobile-label">{group.label}</p>
                ) : null}
                {group.links.map((link) => (
                  <a
                    href={link.href}
                    key={link.label}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
            <a
              className="marketing-header__mobile-login"
              href="/login"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}
