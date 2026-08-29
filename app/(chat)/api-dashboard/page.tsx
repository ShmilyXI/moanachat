"use client";

import {
  BookOpenIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  TerminalIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { RuntimeConfigForm } from "@/components/venice/runtime-config-form";
import {
  VenicePageHeader,
  VenicePageLayout,
} from "@/components/venice/venice-page";

export default function ApiDashboardPage() {
  const { t } = useLocale();

  return (
    <VenicePageLayout>
      <VenicePageHeader
        actions={
          <Button asChild className="gap-2 rounded-lg">
            <Link href="/">
              <TerminalIcon className="size-4" />
              {t("api.tryChat")}
            </Link>
          </Button>
        }
        description={t("api.description")}
        title={t("api.title")}
      />
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-5 py-6 md:grid-cols-3 md:px-10 md:py-10">
        {[
          {
            description: t("api.keyDescription"),
            icon: KeyRoundIcon,
            label: t("api.keys"),
          },
          {
            description: t("api.docsDescription"),
            icon: BookOpenIcon,
            label: t("api.docs"),
          },
          {
            description: t("api.compatDescription"),
            icon: ExternalLinkIcon,
            label: t("api.compatibility"),
          },
        ].map(({ description, icon: Icon, label }) => (
          <section
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]"
            key={label}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-5" />
            </div>
            <h2 className="mt-4 text-sm font-medium">{label}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </section>
        ))}
      </div>
      <RuntimeConfigForm />
      <div className="mx-auto w-full max-w-5xl px-5 pb-10 md:px-10">
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
          <h2 className="text-base font-medium">{t("api.quickstart")}</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            <code>{`curl ${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"${t("api.modelName")}","messages":[...]}'`}</code>
          </pre>
        </section>
      </div>
    </VenicePageLayout>
  );
}
