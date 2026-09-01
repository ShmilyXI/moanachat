export function MarketingFooter() {
  return (
    <footer className="bg-[#eeede4] px-6 py-10 text-[#0e2942]/65 tablet:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-[#0e2942]/10 pt-8 text-sm tablet:flex-row tablet:items-center tablet:justify-between">
        <a className="font-serif text-2xl italic text-[#0e2942]" href="/">
          Moana
        </a>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="/chat">Chat</a>
          <a href="/sign-up">Sign up</a>
          <a href="#pricing">Pricing</a>
          <a href="#developers">API</a>
        </div>
        <span>© 2026 Moana AI</span>
      </div>
    </footer>
  );
}
