"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";

export default function PasswordRecovery({ ar }: { ar: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [attempted, setAttempted] = useState(false);
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // UI-only by request. Do not claim an email was sent without a delivery service.
    setAttempted(true);
  }
  return (
    <section className="auth-layout recovery-layout">
      <div className="auth-story">
        <span className="eyebrow">
          {t("YOUR NOVAMART ACCOUNT", "حسابك في نوفامارت")}
        </span>
        <h1>
          {t("A fresh start.", "بداية جديدة.")}
          <br />
          <em>{t("Back to you.", "وحسابك معك.")}</em>
        </h1>
        <p>
          {t(
            "Forgot your password? Start here to get back to your everyday essentials.",
            "نسيت كلمة المرور؟ ابدأ من هون للعودة إلى حسابك.",
          )}
        </p>
        <LockKeyhole
          className="recovery-icon"
          size={110}
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>
      <div className="auth-form">
        <span className="eyebrow">
          {t("ACCOUNT ACCESS", "الوصول إلى الحساب")}
        </span>
        <h2>{t("Forgot your password?", "نسيت كلمة المرور؟")}</h2>
        <p>
          {t(
            "Enter the email address you used to create your account.",
            "أدخل البريد الإلكتروني الذي استخدمته لإنشاء حسابك.",
          )}
        </p>
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor={id}>
              {t("Email address", "البريد الإلكتروني")}
            </label>
            <input
              id={id}
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAttempted(false);
              }}
            />
          </div>
          {attempted && (
            <div className="recovery-notice" role="alert">
              {t(
                "Password recovery is not available yet. Please try again later.",
                "استعادة كلمة المرور غير متاحة حالياً. يرجى المحاولة لاحقاً.",
              )}
            </div>
          )}
          <button className="btn red full" type="submit">
            {t("Send reset link", "إرسال رابط الاستعادة")}
            <ArrowRight size={18} />
          </button>
        </form>
        <Link className="text-button portal-link" href="/login">
          <ArrowLeft size={16} />
          {t("Back to log in", "العودة لتسجيل الدخول")}
        </Link>
      </div>
    </section>
  );
}
