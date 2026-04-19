import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractCvText,
  isSupportedCvFilename,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/cv-extraction";
import { parseCvWithOpenRouter } from "@/lib/openrouter";

export const runtime = "nodejs";

function redirectWithMessage(
  requestUrl: string,
  pathname: string,
  key: "success" | "error",
  message: string,
) {
  const url = new URL(pathname, requestUrl);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const uploaded = formData.get("file");

  if (!(uploaded instanceof File)) {
    return redirectWithMessage(
      request.url,
      "/upload",
      "error",
      "No file selected.",
    );
  }

  if (!isSupportedCvFilename(uploaded.name)) {
    return redirectWithMessage(
      request.url,
      "/upload",
      "error",
      "Invalid file type. Upload PDF or DOCX.",
    );
  }

  if (uploaded.size > MAX_FILE_SIZE_BYTES) {
    return redirectWithMessage(
      request.url,
      "/upload",
      "error",
      "File size exceeds 16MB.",
    );
  }

  try {
    const extractedText = await extractCvText(uploaded);
    const cvData = await parseCvWithOpenRouter(extractedText);

    let dateOfBirth: Date | null = null;
    if (cvData.date_of_birth) {
      const parsed = new Date(cvData.date_of_birth);
      if (!Number.isNaN(parsed.getTime())) {
        dateOfBirth = parsed;
      }
    }

    await prisma.candidate.create({
      data: {
        name: cvData.name || "Unknown",
        email: cvData.email,
        phone: cvData.phone,
        dateOfBirth,
        skills: cvData.skills,
        experience: cvData.experience,
        education: cvData.education,
        yearsOfExperience: cvData.years_of_experience,
        originalFilename: uploaded.name,
        extractedText,
      },
    });

    return redirectWithMessage(
      request.url,
      "/dashboard",
      "success",
      "CV uploaded and processed successfully.",
    );
  } catch {
    return redirectWithMessage(
      request.url,
      "/upload",
      "error",
      "CV processing failed. Please try another file.",
    );
  }
}