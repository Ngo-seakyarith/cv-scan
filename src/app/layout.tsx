import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CVScan",
  description: "AI-powered CV parsing and candidate management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="site-header">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
            <Link href="/" className="brand-mark" aria-label="CVScan home">
              CVScan
            </Link>

            <nav className="flex items-center gap-2 text-sm font-semibold md:gap-3">
              {session ? (
                <>
                  <Link href="/dashboard" className="nav-pill">
                    Dashboard
                  </Link>
                  <Link href="/upload" className="nav-pill">
                    Upload CV
                  </Link>
                  <Link href="/search" className="nav-pill">
                    Search
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-pill">
                    Login
                  </Link>
                  <Link href="/register" className="nav-pill nav-pill-accent">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-5 pb-8 pt-2 text-sm text-slate-500 md:px-8">
          CVScan Next.js 16, Tailwind, Better Auth, Neon, OpenRouter
        </footer>
      </body>
    </html>
  );
}
