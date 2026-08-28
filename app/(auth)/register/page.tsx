"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type FormEvent, useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { useLocale } from "@/components/locale-provider";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setEmail(new FormData(event.currentTarget).get("email") as string);
  };

  const feedback =
    state.status === "user_exists"
      ? t("chat.auth.accountExists")
      : state.status === "failed"
        ? t("chat.auth.failedCreate")
        : state.status === "invalid_data"
          ? t("chat.auth.failedValidation")
          : null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("chat.auth.registerTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("chat.auth.registerDescription")}
      </p>
      <AuthForm
        action={formAction}
        defaultEmail={email}
        onSubmit={handleSubmit}
      >
        <SubmitButton isSuccessful={isSuccessful}>
          {t("chat.auth.signUp")}
        </SubmitButton>
        {feedback ? (
          <p
            aria-live="polite"
            className="text-center text-sm text-destructive"
            data-testid="auth-feedback"
            role="alert"
          >
            {feedback}
          </p>
        ) : null}
        <p className="text-center text-[13px] text-muted-foreground">
          {`${t("chat.auth.haveAccount")} `}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            {t("chat.auth.signIn")}
          </Link>
        </p>
      </AuthForm>
    </>
  );
}
