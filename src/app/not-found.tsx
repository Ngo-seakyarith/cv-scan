import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <section className="card-surface p-8 text-center">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Error 404
        </p>
        <h1 className="section-title mt-3 text-3xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The requested page or candidate record does not exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to Dashboard
        </Link>
      </section>
    </div>
  );
}