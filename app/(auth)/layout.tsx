"use client";

import Link from "next/link";
import { MoanaMark } from "@/components/marketing/moana-mark";
import { useLocale } from "@/components/locale-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <main className="auth-shell" data-auth-shell data-theme="venice-dark">
      <div className="auth-shell__content">
        <section className="auth-panel" data-auth-panel>
          <div className="auth-panel__brand">
            <Link
              aria-label="Moana"
              className="auth-panel__mark-link"
              data-auth-mark
              href="/"
            >
              <MoanaMark />
            </Link>
          </div>
          <div className="auth-panel__body">{children}</div>
        </section>
        <p className="auth-shell__legal">{t("chat.auth.privateByDefault")}</p>
      </div>
    </main>
  );
}
