import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractCvText,
  isSupportedCvFilename,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/cv-extraction";
import { parseCvWithOpenRouter } from "@/lib/openrouter";

export const maxDuration = 60;

function redirectWithMessage(
  requestUrl: string,
  pathname: string,
  key: "success" | "error",
  message: string,
) {
  const url = new URL(pathname, requestUrl);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url), {
        status: 303,
      });
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
        userId: session.user.id,
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
  } catch (error) {
    console.error("Upload route failed", error);

    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message.trim()
        : "CV processing failed. Please try another file.";

    return redirectWithMessage(
      request.url,
      "/upload",
      "error",
      message,
    );
  }
}
