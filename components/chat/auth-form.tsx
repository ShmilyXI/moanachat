"use client";

import { Eye, EyeOff } from "lucide-react";
import Form from "next/form";
import { useCallback, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  onSubmit,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}) {
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const passwordToggleLabel = showPassword
    ? t("chat.auth.hidePassword")
    : t("chat.auth.showPassword");
  const togglePassword = useCallback(
    () => setShowPassword((visible) => !visible),
    []
  );

  return (
    <Form action={action} className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="email">
          {t("chat.auth.email")}
        </Label>
        <Input
          autoComplete="email"
          autoFocus
          className="auth-form__input"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder={t("chat.auth.emailPlaceholder")}
          required
          type="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="password">
          {t("chat.auth.password")}
        </Label>
        <div className="auth-form__password">
          <Input
            className="auth-form__input auth-form__input--password"
            id="password"
            name="password"
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-pressed={showPassword}
            className="auth-form__password-toggle"
            onClick={togglePassword}
            title={passwordToggleLabel}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            <span className="sr-only">{passwordToggleLabel}</span>
          </button>
        </div>
      </div>

      {children}
    </Form>
  );
}
