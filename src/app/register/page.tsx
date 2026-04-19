import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getServerSession } from "@/lib/session";

export default async function RegisterPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-5">
      <section className="card-surface p-8">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Join CVScan
        </p>
        <h1 className="section-title mt-2 text-3xl font-bold text-slate-900">
          Create Account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign up with Google and start uploading resumes in seconds.
        </p>

        <div className="mt-6">
          <GoogleSignInButton label="Sign Up With Google" />
        </div>
      </section>

      <p className="text-center text-sm text-slate-600">
        Already have access?{" "}
        <Link href="/login" className="font-semibold text-teal-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}