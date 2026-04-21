import { z } from "zod";

const experienceItemSchema = z.object({
  position: z.string().optional(),
  company: z.string().optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
});

const educationItemSchema = z.object({
  degree: z.string().optional(),
  institution: z.string().optional(),
  year: z.string().optional(),
  field: z.string().optional(),
});

const cvSchema = z.object({
  name: z.string().default("Unknown"),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  years_of_experience: z.coerce.number().default(0),
});

export type ParsedCvData = z.infer<typeof cvSchema>;

function cleanString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function extractJsonFromContent(content: string): unknown {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(content.slice(firstBrace, lastBrace + 1));
  }

  return JSON.parse(content);
}

function sanitizeCvData(data: ParsedCvData): ParsedCvData {
  const uniqueSkills = Array.from(
    new Set(
      data.skills
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0)
        .map((skill) => skill.replace(/\s+/g, " ")),
    ),
  );

  return {
    name: data.name?.trim() || "Unknown",
    email: cleanString(data.email),
    phone: cleanString(data.phone),
    date_of_birth: cleanString(data.date_of_birth),
    skills: uniqueSkills,
    experience: data.experience,
    education: data.education,
    years_of_experience:
      Number.isFinite(data.years_of_experience) && data.years_of_experience > 0
        ? data.years_of_experience
        : 0,
  };
}

export async function parseCvWithOpenRouter(text: string): Promise<ParsedCvData> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required.");
  }

  const model = process.env.OPENROUTER_MODEL;
  if (!model) {
    throw new Error("OPENROUTER_MODEL is required.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required.");
  }

  const clippedText = text.slice(0, 24000);

  const prompt = [
    "Extract structured candidate data from the CV text.",
    "Return valid JSON only with this exact structure:",
    "{",
    '  "name": string,',
    '  "email": string | null,',
    '  "phone": string | null,',
    '  "date_of_birth": "YYYY-MM-DD" | null,',
    '  "skills": string[],',
    '  "experience": [{"position": string, "company": string, "duration": string, "description": string}],',
    '  "education": [{"degree": string, "institution": string, "year": string, "field": string}],',
    '  "years_of_experience": number',
    "}",
    "If a field is unknown, set null or an empty array.",
    "CV text:",
    clippedText,
  ].join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-OpenRouter-Title": "CVScan",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You extract resume data. Respond with JSON only and no markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("OpenRouter returned an empty response.");
  }

  try {
    const parsed = extractJsonFromContent(rawContent);
    const result = cvSchema.parse(parsed);
    return sanitizeCvData(result);
  } catch {
    throw new Error("OpenRouter response was not valid CV JSON.");
  }
}