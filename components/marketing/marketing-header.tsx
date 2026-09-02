"use client";

import { ArrowUp, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { saveDemoPrompt } from "./composer";
import { MoanaMark } from "./moana-mark";

const links = [
  { href: "#models", label: "About" },
  { href: "#capabilities", label: "Features" },
  {
    href: "#models",
    label: "Token",
    menu: [
      { href: "#models", label: "VVV" },
      { href: "#models", label: "DIEM" },
    ],
  },
  { href: "#pricing", label: "Pricing" },
  {
    href: "#developers",
    label: "Resources",
    menu: [
      { href: "#developers", label: "API + Docs" },
      { href: "#developers", label: "FAQs" },
      { href: "#privacy", label: "Privacy" },
      { href: "#developers", label: "Blog" },
      { href: "#developers", label: "Media" },
      { href: "#developers", label: "Careers" },
    ],
  },
  { href: "#developers", label: "Store" },
];

const mobileGroups = [
  {
    id: "primary",
    links: [
      { href: "#models", label: "About" },
      { href: "#capabilities", label: "Features" },
    ],
  },
  {
    id: "token",
    label: "Token",
    links: [
      { href: "#models", label: "VVV" },
      { href: "#models", label: "DIEM" },
    ],
  },
  {
    id: "pricing",
    links: [{ href: "#pricing", label: "Pricing" }],
  },
  {
    id: "resources",
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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

  useEffect(() => {
    if (!openDropdown) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("[data-marketing-nav]")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openDropdown]);

  useEffect(() => {
    if (!openDropdown) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openDropdown]);

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
          {links.map((link) =>
            link.menu ? (
              <div className="marketing-header__nav-item" key={link.label}>
                <button
                  aria-expanded={openDropdown === link.label}
                  className="marketing-header__nav-button"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === link.label ? null : link.label
                    )
                  }
                  type="button"
                >
                  {link.label}
                  <ChevronDown aria-hidden className="size-3" />
                </button>
                {openDropdown === link.label ? (
                  <div className="marketing-header__dropdown" data-nav-dropdown>
                    {link.menu.map((item) => (
                      <a
                        href={item.href}
                        key={item.label}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <a href={link.href} key={link.label}>
                {link.label}
              </a>
            )
          )}
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
              <div className="marketing-header__mobile-group" key={group.id}>
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
