"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "#models", label: "About" },
  { href: "#capabilities", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#developers", label: "Resources" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".marketing-home");
    const onScroll = () =>
      setScrolled((container?.scrollTop ?? 0) > window.innerHeight * 0.7);
    onScroll();
    container?.addEventListener("scroll", onScroll, { passive: true });
    return () => container?.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`absolute inset-x-0 top-0 z-30 px-4 py-3 transition-all duration-500 tablet:px-6 tablet:py-4 ${scrolled ? "fixed" : ""}`}
    >
      <div
        className={`mx-auto flex items-center justify-between px-1 transition-all duration-500 tablet:px-2 ${scrolled ? "max-w-[900px] rounded-full border border-[#0e2942]/10 bg-white/80 px-4 py-2 shadow-[0_12px_34px_rgba(14,41,66,0.12)] backdrop-blur-xl" : "max-w-[1200px]"}`}
      >
        <a
          className="font-serif text-[26px] italic leading-none tracking-[-0.08em] text-[#0e2942]"
          href="/"
        >
          Moana
        </a>
        <nav
          className="hidden items-center gap-1 text-sm text-[#0e2942]/70 desktop:flex"
          style={{ display: scrolled ? "flex" : "none" }}
        >
          {links.map((link) => (
            <a
              className="flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-[#0e2942]/[0.05] hover:text-[#0e2942]"
              href={link.href}
              key={link.label}
            >
              {link.label}
              {link.label === "Resources" ? (
                <ChevronDown className="size-3" />
              ) : null}
            </a>
          ))}
          <a
            className="ml-1 rounded-full px-3 py-2 font-medium text-[#0e2942] transition hover:text-[#1260a2]"
            href="/chat"
          >
            Log in
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            className="rounded-xl border border-[#0e2942]/10 bg-white/75 px-4 py-2 text-sm font-medium text-[#0e2942] transition hover:bg-white"
            href="/sign-up"
          >
            Sign up
          </a>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-9 items-center justify-center rounded-full border border-[#0e2942]/10 bg-white/60 desktop:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mx-auto mt-2 max-w-[1120px] rounded-2xl border border-[#0e2942]/10 bg-white/90 p-2 shadow-lg backdrop-blur-xl desktop:hidden">
          {links.map((link) => (
            <a
              className="block rounded-xl px-4 py-3 text-sm text-[#0e2942]/80 hover:bg-[#0e2942]/[0.05]"
              href={link.href}
              key={link.label}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            className="block rounded-xl px-4 py-3 text-sm font-medium text-[#1260a2]"
            href="/chat"
          >
            Log in
          </a>
        </nav>
      ) : null}
    </header>
  );
}
