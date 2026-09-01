"use client";

import {
  Apple,
  Chrome,
  CircleDollarSign,
  Eye,
  EyeOff,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import Form from "next/form";
import { useCallback, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const socialProviders = [
  { icon: Apple, label: "Continue with Apple" },
  { icon: CircleDollarSign, label: "Continue with Coinbase" },
  { icon: MessageCircle, label: "Continue with Discord" },
  { icon: Chrome, label: "Continue with Google" },
  { icon: WalletCards, label: "Continue with WalletConnect" },
];

function AuthSocialProviders() {
  return (
    <>
      <div aria-label="Other sign-in options" className="auth-socials" role="group">
        {socialProviders.map(({ icon: Icon, label }) => (
          <button
            aria-label={label}
            className="auth-socials__button"
            disabled
            key={label}
            title="第三方登录暂未开放"
            type="button"
          >
            <Icon aria-hidden />
          </button>
        ))}
      </div>
      <div className="auth-divider" aria-hidden="true">
        <span>or</span>
      </div>
    </>
  );
}

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
      <AuthSocialProviders />
      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="email">
          {t("chat.auth.email")}
        </Label>
        <Input
          autoComplete="email"
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
            placeholder={t("chat.auth.passwordPlaceholder")}
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
