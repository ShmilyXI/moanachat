import { MoanaMark } from "./moana-mark";

const footerGroups = [
  {
    links: [
      { href: "#models", label: "About" },
      { href: "#capabilities", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#developers", label: "Blog" },
    ],
    title: "Product",
  },
  {
    links: [
      { href: "#developers", label: "API Docs" },
      { href: "#developers", label: "Guides" },
      { href: "#developers", label: "API Reference" },
      { href: "#developers", label: "Status" },
    ],
    title: "Developers",
  },
  {
    links: [
      { href: "#privacy", label: "Privacy Policy" },
      { href: "#privacy", label: "Terms of Service" },
      { href: "#developers", label: "Contact" },
    ],
    title: "Legal",
  },
];

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer__inner">
        <a aria-label="Moana" className="marketing-footer__mark" href="/">
          <MoanaMark />
        </a>
        <p className="marketing-footer__tagline">Private, unrestricted AI for everyone.</p>
        <div className="marketing-footer__groups">
          {footerGroups.map((group) => (
            <div className="marketing-footer__group" key={group.title}>
              <h2>{group.title}</h2>
              <div>
                {group.links.map((link) => (
                  <a href={link.href} key={link.label}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="marketing-footer__bottom">
          <span>© 2026 Moana AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
