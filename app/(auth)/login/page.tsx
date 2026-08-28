"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type FormEvent, useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { useLocale } from "@/components/locale-provider";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
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
    state.status === "failed"
      ? t("chat.auth.invalidCredentials")
      : state.status === "invalid_data"
        ? t("chat.auth.failedValidation")
        : null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("chat.auth.loginTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("chat.auth.loginDescription")}
      </p>
      <AuthForm
        action={formAction}
        defaultEmail={email}
        onSubmit={handleSubmit}
      >
        <SubmitButton isSuccessful={isSuccessful}>
          {t("chat.auth.signIn")}
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
          {`${t("chat.auth.noAccount")} `}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/register"
          >
            {t("chat.auth.signUp")}
          </Link>
        </p>
      </AuthForm>
    </>
  );
}
