import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const user = data.claims;

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome! This is a protected route that requires authentication
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="font-bold text-2xl">Protected Content</h2>
          </div>
          <p className="text-muted-foreground">
            {`You're successfully authenticated and viewing protected content. The
            middleware validates your session on every request.`}
          </p>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h2 className="font-bold text-2xl">Session Management</h2>
          </div>
          <p className="text-muted-foreground">
            Your session is managed securely with HTTP-only cookies. The session
            refreshes automatically and persists across page navigation.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">Your User Details</h2>
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="font-semibold">Email:</span>
              <span className="text-muted-foreground">{user.email}</span>
            </div>
            {user.user_metadata &&
              Object.keys(user.user_metadata).length > 0 && (
                <div className="flex gap-2">
                  <span className="font-semibold">Metadata:</span>
                  <span className="text-muted-foreground">
                    {JSON.stringify(user.user_metadata)}
                  </span>
                </div>
              )}
          </div>
        </div>
        <details className="border rounded-lg">
          <summary className="p-4 cursor-pointer font-medium">
            View Full Token Claims (JSON)
          </summary>
          <pre className="text-xs font-mono p-4 bg-muted/30 overflow-auto max-h-64">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </div>

      <div className="flex gap-4 items-center">
        <Button asChild variant="outline">
          <Link href="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
