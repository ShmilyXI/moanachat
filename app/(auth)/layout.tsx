"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { SparklesIcon } from "@/components/chat/icons";
import { useLocale } from "@/components/locale-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <main className="auth-shell" data-auth-shell data-theme="venice-dark">
      <div
        aria-hidden
        className="auth-shell__lines"
        data-auth-concentric-lines
      />
      <div className="auth-shell__content">
        <Link className="auth-shell__back" href="/">
          <ArrowLeftIcon className="size-3.5" />
          {t("chat.auth.back")}
        </Link>
        <section className="auth-panel" data-auth-panel>
          <div className="auth-panel__brand">
            <span className="auth-panel__mark">
              <SparklesIcon size={14} />
            </span>
            <span className="auth-panel__wordmark">Moana</span>
          </div>
          <div className="auth-panel__body">{children}</div>
          <p className="auth-panel__caption">
            {t("chat.auth.poweredBy")} Moana AI
          </p>
        </section>
        <p className="auth-shell__legal">Private by default</p>
      </div>
    </main>
  );
}
