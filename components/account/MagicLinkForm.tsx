"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/react";
import { IconArrowRight } from "@/components/ui/icons";
import { Button, Panel } from "@/components/ui/primitives";

export function MagicLinkForm({
  redirectTo,
  email: initialEmail,
  lifetime,
}: {
  redirectTo: string;
  email?: string;
  lifetime: string;
}) {
  const t = useT();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    const result = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-xl">
        <p className="label">{t("login.label")}</p>
        <h1 className="mt-3 font-display text-[2rem] leading-tight text-ink sm:text-[2.5rem]">
          {t("login.sent.title")}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
          {t("login.sent.pre")}
          <span className="text-ink [overflow-wrap:anywhere]">{email}</span>
          {t("login.sent.post")}
        </p>
        <p className="mt-2 text-[13px] text-ink-3">{lifetime}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-[13px] text-ink-2 underline decoration-line-2 underline-offset-4 transition-colors hover:text-ink"
        >
          {t("login.sent.another")}
        </button>
      </div>
    );
  }

  return (
    <Panel className="mt-8 p-5 sm:p-6">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="email" className="label">
            {t("login.emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("login.emailPlaceholder")}
            className="mt-2 h-11 w-full rounded-[5px] border border-line-2 bg-surface px-3 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3"
          />
        </div>
        <Button type="submit" size="lg" className="shrink-0" disabled={pending}>
          {pending ? t("login.send") : t("login.send")}
          <IconArrowRight size={16} />
        </Button>
      </form>
      {error ? <p className="mt-3 text-[13px] text-rust">{t("login.error", { error })}</p> : null}
    </Panel>
  );
}
