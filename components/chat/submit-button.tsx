"use client";

import { useFormStatus } from "react-dom";
import { LoaderIcon } from "@/components/chat/icons";
import { useLocale } from "@/components/locale-provider";

import { Button } from "../ui/button";

export function SubmitButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { pending } = useFormStatus();
  const { t } = useLocale();

  return (
    <Button
      aria-disabled={pending || isSuccessful}
      className="relative"
      disabled={pending || isSuccessful}
      type={pending ? "button" : "submit"}
    >
      {children}

      {pending || isSuccessful ? (
        <span className="absolute right-4 animate-spin">
          <LoaderIcon />
        </span>
      ) : null}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful
          ? t("chat.auth.loading")
          : t("chat.auth.submit")}
      </output>
    </Button>
  );
}
