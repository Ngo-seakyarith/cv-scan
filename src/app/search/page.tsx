import Link from "next/link";
import {
  findCandidates,
  toEducationItems,
  toExperienceItems,
} from "@/lib/candidates";
import { requireServerSession } from "@/lib/session";

type SearchPageParams = Promise<{
  skills?: string;
  min_experience?: string;
  success?: string;
  error?: string;
}>;

function toExportUrl(skillsFilter: string, minExperienceRaw: string): string {
  const params = new URLSearchParams();
  if (skillsFilter) {
    params.set("skills", skillsFilter);
  }
  if (minExperienceRaw) {
    params.set("min_experience", minExperienceRaw);
  }

  const query = params.toString();
  return query ? `/api/candidates/export?${query}` : "/api/candidates/export";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  await requireServerSession();

  const params = await searchParams;

  const skillsFilter = params.skills?.trim() ?? "";
  const minExperienceRaw = params.min_experience?.trim() ?? "";
  const parsedMinExperience = minExperienceRaw ? Number(minExperienceRaw) : undefined;
  const minExperience =
    typeof parsedMinExperience === "number" && Number.isFinite(parsedMinExperience)
      ? parsedMinExperience
      : undefined;

  const hasFilters = Boolean(skillsFilter || minExperienceRaw);
  const candidates = hasFilters
    ? await findCandidates({ skillsFilter, minExperience })
    : [];

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl font-bold text-slate-900">Search & Filter</h1>
          <p className="mt-2 text-sm text-slate-600">
            Filter candidates by fuzzy skills and minimum years of experience.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold"
        >
          Back to Dashboard
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

      <section className="card-surface p-5">
        <form className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto]" method="GET" action="/search">
          <div>
            <label htmlFor="skills" className="mb-2 block text-sm font-semibold text-slate-700">
              Skills (comma-separated)
            </label>
            <input
              id="skills"
              name="skills"
              defaultValue={skillsFilter}
              placeholder="Python, React, Data Analysis"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="min_experience"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Min Experience (years)
            </label>
            <input
              id="min_experience"
              name="min_experience"
              type="number"
              step="0.5"
              min="0"
              defaultValue={minExperienceRaw}
              placeholder="2.5"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {hasFilters ? (
        <section className="card-surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
            <div>
              <h2 className="section-title text-xl font-bold text-slate-900">Search Results</h2>
              <p className="text-sm text-slate-600">
                Found {candidates.length} candidate(s).
              </p>
            </div>

            {candidates.length > 0 ? (
              <a
                href={toExportUrl(skillsFilter, minExperienceRaw)}
                className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Export to Excel
              </a>
            ) : null}
          </div>

          {candidates.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No candidates matched your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-white/60 text-left text-slate-600">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Skills</th>
                    <th className="px-4 py-3">Experience</th>
                    <th className="px-4 py-3">Education</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => {
                    const education = toEducationItems(candidate.education);
                    const experience = toExperienceItems(candidate.experience);

                    return (
                      <tr key={candidate.id} className="border-b border-[var(--line)]/70 align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">{candidate.name}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <p>{candidate.email ?? "N/A"}</p>
                          <p className="text-xs text-slate-500">{candidate.phone ?? "N/A"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 4).map((skill: string) => (
                              <span
                                key={`${candidate.id}-${skill}`}
                                className="rounded-full border border-[var(--line)] bg-white px-2 py-1 text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 4 ? (
                              <span className="rounded-full border border-[var(--line)] bg-white px-2 py-1 text-xs">
                                +{candidate.skills.length - 4}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p>{candidate.yearsOfExperience} years</p>
                          <p className="text-xs text-slate-500">
                            {experience.length} position(s)
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {education.length === 0 ? "N/A" : education[0]?.degree ?? "N/A"}
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
                              <input type="hidden" name="returnTo" value="/search" />
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card-surface p-6 text-sm text-slate-600">
          Use the filters above to find candidates by skills and experience.
        </section>
      )}
    </div>
  );
}