import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import {
  educationToText,
  experienceToText,
  findCandidates,
  toEducationItems,
  toExperienceItems,
} from "@/lib/candidates";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const skillsFilter = url.searchParams.get("skills")?.trim() ?? "";
  const minExperienceRaw = url.searchParams.get("min_experience");
  const minExperience = minExperienceRaw ? Number(minExperienceRaw) : undefined;

  const candidates = await findCandidates({
    skillsFilter,
    minExperience:
      typeof minExperience === "number" && Number.isFinite(minExperience)
        ? minExperience
        : undefined,
  });

  const rows = candidates.map((candidate) => ({
    Name: candidate.name,
    Email: candidate.email ?? "",
    Phone: candidate.phone ?? "",
    "Date of Birth": candidate.dateOfBirth
      ? candidate.dateOfBirth.toISOString().slice(0, 10)
      : "",
    Skills: candidate.skills.join(", "),
    "Years of Experience": candidate.yearsOfExperience,
    "Experience Details": experienceToText(toExperienceItems(candidate.experience)),
    Education: educationToText(toEducationItems(candidate.education)),
    "Upload Date": candidate.uploadDate.toISOString(),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const filename = `candidates_export_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}