import Link from "next/link";
import {
  dashboardTextFilter,
  listCandidates,
  uploadedTodayCount,
} from "@/lib/candidates";
import { requireServerSession } from "@/lib/session";

type DashboardSearchParams = Promise<{
  q?: string;
  success?: string;
  error?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  await requireServerSession();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const candidates = await listCandidates();
  const visibleCandidates = dashboardTextFilter(candidates, query);

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage candidate records and resume parsing results.
          </p>
        </div>

        <Link
          href="/upload"
          className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal-800"
        >
          Upload CV
        </Link>
      </section>

      {params.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.success}
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        <article className="card-surface p-4">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Total Candidates
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{candidates.length}</p>
        </article>

        <article className="card-surface p-4">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Uploaded Today
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {uploadedTodayCount(candidates)}
          </p>
        </article>

        <Link href="/search" className="card-surface block p-4 transition hover:-translate-y-0.5">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Search</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Filter Candidates</p>
        </Link>

        <a
          href="/api/candidates/export"
          className="card-surface block p-4 transition hover:-translate-y-0.5"
        >
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Export</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Download Excel</p>
        </a>
      </section>

      <section className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
          <h2 className="section-title text-xl font-bold text-slate-900">Recent Candidates</h2>

          <form className="flex w-full max-w-sm gap-2" method="GET" action="/dashboard">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, email, phone, skill"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        {visibleCandidates.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600">No candidates found.</p>
            <Link
              href="/upload"
              className="mt-4 inline-block rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Upload your first CV
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-white/60 text-left text-slate-600">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Upload Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-[var(--line)]/70 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{candidate.name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {candidate.email ? (
                        <a href={`mailto:${candidate.email}`} className="hover:underline">
                          {candidate.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{candidate.phone ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((skill: string) => (
                          <span
                            key={`${candidate.id}-${skill}`}
                            className="rounded-full border border-[var(--line)] bg-white px-2 py-1 text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 ? (
                          <span className="rounded-full border border-[var(--line)] bg-white px-2 py-1 text-xs">
                            +{candidate.skills.length - 3} more
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {candidate.yearsOfExperience} years
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {candidate.uploadDate.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/candidate/${candidate.id}`}
                          className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold"
                        >
                          View
                        </Link>

                        <form action={`/api/candidates/${candidate.id}/delete`} method="POST">
                          <input type="hidden" name="returnTo" value="/dashboard" />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}