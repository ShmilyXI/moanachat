"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { type FormEvent, useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { useLocale } from "@/components/locale-provider";
import { NEW_CHAT_PATH } from "@/lib/chat/routes";
import { type LoginActionState, login } from "../actions";

export function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push(NEW_CHAT_PATH);
    }
  }, [state.status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setEmail(new FormData(event.currentTarget).get("email") as string);
  };

  const oauthError = searchParams.get("error");
  const oauthFeedback = oauthError
    ? oauthError === "access_denied"
      ? t("chat.auth.googleCancelled")
      : oauthError === "google_unconfigured"
        ? t("chat.auth.googleUnconfigured")
        : t("chat.auth.googleFailed")
    : null;

  const feedback =
    state.status === "failed"
      ? t("chat.auth.invalidCredentials")
      : state.status === "invalid_data"
        ? t("chat.auth.failedValidation")
        : (oauthFeedback ?? null);

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
        googleIntent="login"
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
        <div className="auth-form__links">
          <p>
            {`${t("chat.auth.noAccount")} `}
            <Link href="/register">{t("chat.auth.signUp")}</Link>
          </p>
          <p className="auth-form__guest">
            <a href="/api/auth/guest?redirectUrl=%2F">
              {t("chat.auth.tryWithoutAccount")}
            </a>
          </p>
        </div>
      </AuthForm>
    </>
  );
}
