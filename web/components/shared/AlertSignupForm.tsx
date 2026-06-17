"use client";

import { useState, useTransition } from "react";
import { submitAlertInterest } from "@/lib/actions/alerts";
import { Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/lib/dictionary";

interface AlertSignupFormProps {
  sourcePage: string;
  locale?: "en" | "ne";
  compact?: boolean;
  dict: Dictionary;
}

export default function AlertSignupForm({
  sourcePage,
  locale = "en",
  compact = false,
  dict,
}: AlertSignupFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage(dict.alerts.error_empty_email);
      return;
    }

    startTransition(async () => {
      const res = await submitAlertInterest(emailTrimmed, locale, sourcePage);
      if (res.success) {
        setIsSubmitted(true);
        setEmail("");
      } else {
        const errKey = res.error;
        let msg = dict.alerts.error_server;
        if (errKey === "Please enter a valid email address.") {
          msg = dict.alerts.error_invalid_email;
        } else if (errKey === "Database error. Please try again.") {
          msg = dict.alerts.error_db;
        }
        setErrorMessage(msg);
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className={`bg-leaf-50 border border-leaf-100 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm w-full`}>
        <CheckCircle2 className="h-10 w-10 text-leaf-600 mb-3" />
        <h3 className="font-bold text-soil-800 text-lg">{dict.alerts.success}</h3>
        <p className="text-sm text-soil-800/70 mt-1 max-w-sm">
          {dict.alerts.success_desc}
        </p>
      </div>
    );
  }

  // Compact layout for the commodity detail page sidebar
  if (compact) {
    return (
      <div className="bg-leaf-600 text-white rounded-xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute -right-6 -top-6 opacity-10">
          <Bell className="h-28 w-28 text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 fill-white/20" />
            <h3 className="font-bold text-base">{dict.alerts.title_compact}</h3>
          </div>
          <p className="text-xs text-white/90 mb-4 leading-relaxed">
            {dict.alerts.desc_compact}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-white/80">
                {dict.alerts.email_label}
              </label>
              <input
                type="email"
                placeholder={dict.alerts.email_placeholder_compact}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg bg-white text-soil-800 border-0 focus:ring-2 focus:ring-leaf-100 placeholder-soil-800/40 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-white text-leaf-700 font-bold py-2.5 rounded-lg text-xs hover:bg-leaf-50 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-1 cursor-pointer"
            >
              {isPending ? dict.alerts.subscribing : dict.alerts.submit}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-3 flex items-center gap-1 text-[11px] text-orange-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard full-width layout for the dashboard and category footer CTA
  return (
    <section className="bg-leaf-50 border border-leaf-100 rounded-xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm w-full">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-leaf-700 mb-1">{dict.alerts.title}</h2>
        <p className="text-sm text-soil-800/70">
          {dict.alerts.desc}
        </p>
      </div>
      <div className="w-full md:w-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder={dict.alerts.email_placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="px-4 py-2 bg-white border border-leaf-100 rounded-lg text-sm text-soil-800 placeholder-soil-800/40 focus:outline-none focus:border-leaf-600 focus:ring-1 focus:ring-leaf-600 w-full sm:w-64 shadow-inner"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-leaf-600 text-white rounded-lg text-sm font-semibold hover:bg-leaf-700 transition-colors shadow-interactive whitespace-nowrap cursor-pointer disabled:opacity-70 flex items-center justify-center"
          >
            {isPending ? dict.alerts.subscribing : dict.alerts.submit}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}
