import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Auth Demo</Link>
            </div>
            <AuthButton />
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col gap-6 items-center">
            <h1 className="text-4xl font-bold text-center">
              Next.js Authentication Demo
            </h1>
            <p className="text-xl text-center text-muted-foreground max-w-2xl">
              A complete authentication implementation with Supabase, featuring
              sign up, login, password recovery, and protected routes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl">
            <div className="border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold">Authentication Features</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Email & Password Authentication</li>
                <li>✅ Email Verification</li>
                <li>✅ Password Recovery</li>
                <li>✅ Secure Cookie Sessions</li>
                <li>✅ Protected Routes</li>
                <li>✅ Server & Client Components</li>
              </ul>
            </div>
            <div className="border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold">Tech Stack</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>🔄 Next.js 15 App Router</li>
                <li>⚡ Server-Side Rendering</li>
                <li>🔐 Supabase Auth</li>
                <li>🎨 Tailwind CSS + shadcn/ui</li>
                <li>🌓 Dark Mode Support</li>
                <li>📱 Fully Responsive</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <p className="text-center text-muted-foreground">
              <Link
                href="/auth/sign-up"
                className="font-bold hover:underline cursor-pointer text-primary"
              >
                Sign up
              </Link>{" "}
              or{" "}
              <Link
                href="/auth/login"
                className="font-bold hover:underline cursor-pointer text-primary"
              >
                log in
              </Link>{" "}
              to access protected content and see all features in action
            </p>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Built with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Next.js
            </a>{" "}
            and{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
