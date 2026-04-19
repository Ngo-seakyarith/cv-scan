"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "@/lib/auth-client";

type GoogleSignInButtonProps = {
  label: string;
  callbackURL?: string;
};

export function GoogleSignInButton({
  label,
  callbackURL = "/dashboard",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = () => {
    startTransition(async () => {
      setError(null);

      const result = (await signIn.social({
        provider: "google",
        callbackURL,
      })) as { error?: { message?: string } } | undefined;

      if (result?.error) {
        setError(result.error.message ?? "Google sign-in failed.");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isPending}
        className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Redirecting to Google..." : label}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}