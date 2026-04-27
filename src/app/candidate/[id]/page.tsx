import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCandidateById,
  toEducationItems,
  toExperienceItems,
} from "@/lib/candidates";
import { requireServerSession } from "@/lib/session";

type CandidateDetailParams = Promise<{ id: string }>;

export default async function CandidateDetailPage({
  params,
}: {
  params: CandidateDetailParams;
}) {
  const session = await requireServerSession();

  const { id } = await params;
  const candidateId = Number.parseInt(id, 10);

  if (Number.isNaN(candidateId)) {
    notFound();
  }

  const candidate = await getCandidateById(candidateId, session.user.id);
  if (!candidate) {
    notFound();
  }

  const experience = toExperienceItems(candidate.experience);
  const education = toEducationItems(candidate.education);

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl font-bold text-slate-900">{candidate.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Candidate Details</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>

          <form action={`/api/candidates/${candidate.id}/delete`} method="POST">
            <input type="hidden" name="returnTo" value="/dashboard" />
            <button
              type="submit"
              className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700"
            >
              Delete
            </button>
          </form>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[340px_1fr]">
        <section className="card-surface p-5">
          <h2 className="section-title text-xl font-bold text-slate-900">Personal Info</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <dt className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Email</dt>
              <dd>{candidate.email ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Phone</dt>
              <dd>{candidate.phone ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Date of Birth
              </dt>
              <dd>
                {candidate.dateOfBirth
                  ? candidate.dateOfBirth.toISOString().slice(0, 10)
                  : "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Years of Experience
              </dt>
              <dd>{candidate.yearsOfExperience}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Upload Date</dt>
              <dd>{candidate.uploadDate.toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-4">
          <section className="card-surface p-5">
            <h2 className="section-title text-xl font-bold text-slate-900">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.skills.length === 0 ? (
                <p className="text-sm text-slate-600">No skills information available.</p>
              ) : (
                candidate.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs"
                  >
                    {skill}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="section-title text-xl font-bold text-slate-900">Work Experience</h2>
            <div className="mt-4 space-y-4">
              {experience.length === 0 ? (
                <p className="text-sm text-slate-600">No work experience available.</p>
              ) : (
                experience.map((item, index) => (
                  <article
                    key={`${item.company ?? "company"}-${index}`}
                    className="rounded-xl border border-[var(--line)] bg-white p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {item.position ?? "Position not specified"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.company ?? "Company not specified"}
                    </p>
                    {item.duration ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500 uppercase">
                        {item.duration}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-2 text-sm text-slate-700">{item.description}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="section-title text-xl font-bold text-slate-900">Education</h2>
            <div className="mt-4 space-y-4">
              {education.length === 0 ? (
                <p className="text-sm text-slate-600">No education information available.</p>
              ) : (
                education.map((item, index) => (
                  <article
                    key={`${item.institution ?? "institution"}-${index}`}
                    className="rounded-xl border border-[var(--line)] bg-white p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {item.degree ?? "Degree not specified"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.institution ?? "Institution not specified"}
                    </p>
                    {item.field ? (
                      <p className="mt-2 text-sm text-slate-700">Field: {item.field}</p>
                    ) : null}
                    {item.year ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500 uppercase">{item.year}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="section-title text-xl font-bold text-slate-900">Original CV Text</h2>
            <pre className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-white p-3 text-xs text-slate-700">
              {candidate.extractedText ?? "Original text not available."}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
