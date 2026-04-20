import Link from "next/link";

export default function Home() {
  return (
    <div className="grid w-full gap-8 md:grid-cols-[1.35fr_1fr]">
      <section className="card-surface relative overflow-hidden p-8 md:p-12">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-teal-500/20 blur-2xl" />
        <div className="absolute -bottom-16 left-16 h-44 w-44 rounded-full bg-orange-400/25 blur-2xl" />

        <p className="mb-4 inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold tracking-widest text-slate-600 uppercase">
          AI-Powered Resume Ops
        </p>

        <h1 className="section-title max-w-2xl text-4xl leading-tight font-bold text-slate-900 md:text-5xl">
          Scan CVs, extract candidate data, and search talent fast.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
          Upload PDF or DOCX resumes and let OpenRouter models structure each
          profile automatically. Then filter by skills and experience, inspect
          candidate detail pages, and export shortlists to Excel.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-800"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section className="card-surface p-8 md:p-10">
        <h2 className="section-title text-2xl font-bold text-slate-900">
          What You Can Do
        </h2>
        <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
          <li>1. Sign in and access your candidate dashboard</li>
          <li>2. Upload resumes in PDF or DOCX format</li>
          <li>3. Automatically extract candidate profile information</li>
          <li>4. Filter candidates by skills and experience</li>
          <li>5. Review details, clean records, and export shortlists</li>
        </ol>
      </section>
    </div>
  );
}
