import Link from "next/link";
import { requireServerSession } from "@/lib/session";

type UploadSearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function UploadPage({
  searchParams,
}: {
  searchParams: UploadSearchParams;
}) {
  await requireServerSession();
  const params = await searchParams;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <section className="card-surface p-8">
        <h1 className="section-title text-3xl font-bold text-slate-900">Upload CV</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Upload a PDF or DOCX resume. The system extracts text, sends it to
          OpenRouter, and stores structured candidate data.
        </p>

        {params.success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {params.success}
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}

        <form
          action="/api/candidates/upload"
          method="POST"
          encType="multipart/form-data"
          className="mt-6 space-y-4"
        >
          <div>
            <label htmlFor="file" className="mb-2 block text-sm font-semibold text-slate-700">
              CV File
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.docx"
              required
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              Allowed formats: PDF, DOCX. Maximum size: 16MB.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-800"
            >
              Process With AI
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </form>
      </section>

      <section className="card-surface p-6">
        <h2 className="section-title text-xl font-semibold text-slate-900">What happens next?</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>1. Resume text is extracted from the uploaded file.</li>
          <li>2. OpenRouter returns structured candidate fields.</li>
          <li>3. Candidate appears in dashboard, search, and export flows.</li>
        </ul>
      </section>
    </div>
  );
}