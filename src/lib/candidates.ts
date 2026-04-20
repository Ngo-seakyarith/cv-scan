import { prisma } from "@/lib/prisma";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type Candidate = NonNullable<
  Awaited<ReturnType<typeof prisma.candidate.findUnique>>
>;

export type ExperienceItem = {
  position?: string;
  company?: string;
  duration?: string;
  description?: string;
};

export type EducationItem = {
  degree?: string;
  institution?: string;
  year?: string;
  field?: string;
};

type CandidateFilters = {
  skillsFilter?: string;
  minExperience?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function toExperienceItems(value: JsonValue | null): ExperienceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: ExperienceItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }

    items.push({
      position:
        typeof record.position === "string" ? record.position.trim() : undefined,
      company: typeof record.company === "string" ? record.company.trim() : undefined,
      duration: typeof record.duration === "string" ? record.duration.trim() : undefined,
      description:
        typeof record.description === "string"
          ? record.description.trim()
          : undefined,
    });
  }

  return items;
}

export function toEducationItems(value: JsonValue | null): EducationItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: EducationItem[] = [];
  for (const rawItem of value) {
    const record = asRecord(rawItem);
    if (!record) {
      continue;
    }

    items.push({
      degree: typeof record.degree === "string" ? record.degree.trim() : undefined,
      institution:
        typeof record.institution === "string"
          ? record.institution.trim()
          : undefined,
      year: typeof record.year === "string" ? record.year.trim() : undefined,
      field: typeof record.field === "string" ? record.field.trim() : undefined,
    });
  }

  return items;
}

function toBigrams(input: string): string[] {
  const normalized = input.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized.length <= 2) {
    return [normalized];
  }

  const pairs: string[] = [];
  for (let i = 0; i < normalized.length - 1; i += 1) {
    pairs.push(normalized.slice(i, i + 2));
  }
  return pairs;
}

function fuzzySimilarity(a: string, b: string): number {
  const left = toBigrams(a);
  const right = toBigrams(b);

  if (!left[0] || !right[0]) {
    return 0;
  }

  const rightCounts = new Map<string, number>();
  for (const token of right) {
    rightCounts.set(token, (rightCounts.get(token) ?? 0) + 1);
  }

  let overlap = 0;
  for (const token of left) {
    const count = rightCounts.get(token) ?? 0;
    if (count > 0) {
      overlap += 1;
      rightCounts.set(token, count - 1);
    }
  }

  return (2 * overlap) / (left.length + right.length);
}

function parseSkillFilter(raw: string): string[] {
  return raw
    .split(",")
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);
}

function matchesSkillFilter(candidateSkills: string[], searchSkills: string[]): boolean {
  if (searchSkills.length === 0) {
    return true;
  }

  return searchSkills.some((wantedSkill) =>
    candidateSkills.some(
      (candidateSkill) => fuzzySimilarity(wantedSkill, candidateSkill.toLowerCase()) >= 0.6,
    ),
  );
}

export async function listCandidates(): Promise<Candidate[]> {
  return prisma.candidate.findMany({
    orderBy: { uploadDate: "desc" },
  });
}

export async function findCandidates(filters: CandidateFilters): Promise<Candidate[]> {
  const allCandidates = await listCandidates();
  const searchSkills = parseSkillFilter(filters.skillsFilter ?? "");

  return allCandidates.filter((candidate) => {
    if (!matchesSkillFilter(candidate.skills, searchSkills)) {
      return false;
    }

    if (
      typeof filters.minExperience === "number" &&
      !Number.isNaN(filters.minExperience) &&
      candidate.yearsOfExperience < filters.minExperience
    ) {
      return false;
    }

    return true;
  });
}

export async function getCandidateById(id: number): Promise<Candidate | null> {
  return prisma.candidate.findUnique({
    where: { id },
  });
}

export function uploadedTodayCount(candidates: Candidate[]): number {
  const todayKey = new Date().toDateString();
  return candidates.filter(
    (candidate) => candidate.uploadDate.toDateString() === todayKey,
  ).length;
}

export function dashboardTextFilter(candidates: Candidate[], query: string): Candidate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return candidates;
  }

  return candidates.filter((candidate) => {
    const inName = candidate.name.toLowerCase().includes(normalized);
    const inEmail = (candidate.email ?? "").toLowerCase().includes(normalized);
    const inPhone = (candidate.phone ?? "").toLowerCase().includes(normalized);
    const inSkills = candidate.skills.some((skill) =>
      skill.toLowerCase().includes(normalized),
    );

    return inName || inEmail || inPhone || inSkills;
  });
}

export function experienceToText(items: ExperienceItem[]): string {
  return items
    .map((item) => {
      const role = item.position ?? "Role";
      const company = item.company ?? "Unknown company";
      const duration = item.duration ? ` (${item.duration})` : "";
      return `${role} at ${company}${duration}`;
    })
    .join("; ");
}

export function educationToText(items: EducationItem[]): string {
  return items
    .map((item) => {
      const degree = item.degree ?? "Degree";
      const institution = item.institution ?? "Institution";
      const year = item.year ? ` (${item.year})` : "";
      return `${degree} at ${institution}${year}`;
    })
    .join("; ");
}
