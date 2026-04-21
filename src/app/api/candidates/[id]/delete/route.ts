import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url), {
      status: 303,
    });
  }

  const { id } = await context.params;
  const candidateId = Number.parseInt(id, 10);

  const formData = await request.formData();
  const maybeReturnTo = formData.get("returnTo");
  const returnTo =
    typeof maybeReturnTo === "string" && maybeReturnTo.startsWith("/")
      ? maybeReturnTo
      : "/dashboard";

  if (Number.isNaN(candidateId)) {
    const invalidUrl = new URL(returnTo, request.url);
    invalidUrl.searchParams.set("error", "Invalid candidate id.");
    return NextResponse.redirect(invalidUrl, { status: 303 });
  }

  await prisma.candidate.delete({ where: { id: candidateId } }).catch(() => null);

  const redirectUrl = new URL(returnTo, request.url);
  redirectUrl.searchParams.set("success", "Candidate deleted successfully.");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}