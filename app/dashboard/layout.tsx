import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { UserProviderWrapper } from "@/components/dashboard/user-provider-wrapper";
import { UsersRound } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/auth/login");
  }

  const user = data.claims;

  if (!user?.sub) {
    redirect("/auth/login");
  }

  return (
    <UserProviderWrapper>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header solo visible en mobile, en desktop no hay header */}
          <header className="md:hidden flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold truncate">
                  Organizador
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  de Equipos
                </span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SidebarTrigger className="-mr-1" />
            </div>
          </header>
          {/* En desktop, el SidebarRail proporciona el toggle, no necesitamos header */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:pt-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserProviderWrapper>
  );
}
