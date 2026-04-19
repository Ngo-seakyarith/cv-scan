import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getServerSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-5">
      <section className="card-surface p-8">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Welcome back
        </p>
        <h1 className="section-title mt-2 text-3xl font-bold text-slate-900">
          Sign In
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Continue with your Google account to access the CV dashboard.
        </p>

        <div className="mt-6">
          <GoogleSignInButton label="Continue With Google" />
        </div>
      </section>

      <p className="text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link href="/register" className="font-semibold text-teal-700 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}