"use client";

import { useState, type FormEvent } from "react";

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    // TODO: wire this up to a real endpoint once the backend is ready, e.g.
    // POST /api/early-access with { email } and surface loading/error state.
    console.log("Early access signup:", email);

    setSubmitted(true);
    setEmail("");
  };

  return (
    <section id="early-access" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-white/[0.06] bg-bg-raised/60 px-6 py-14 text-center sm:px-14">
        <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
          Erken erişime katıl
        </h2>
        <p className="mt-4 max-w-md text-muted">
          Lupra aktif geliştirme aşamasında. İlk erişim listesine katıl.
        </p>

        {submitted ? (
          <p role="status" aria-live="polite" className="mt-8 text-accent-light">
            Teşekkürler! Seni erken erişim listesine ekledik.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            noValidate
          >
            <label htmlFor="early-access-email" className="sr-only">
              E-posta adresin
            </label>
            <input
              id="early-access-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresin"
              aria-label="E-posta adresin"
              className="w-full flex-1 rounded-full border border-white/10 bg-bg px-5 py-3 text-white placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-light"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Katıl
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
