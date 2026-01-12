"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  UsersRound,
  LayoutDashboard,
  Tag,
  BriefcaseBusiness,
  Calendar,
  LucideIcon,
} from "lucide-react";
import { SidebarUserMenu } from "@/components/dashboard/sidebar-user-menu";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Calendar,
  },
  {
    title: "Grupos",
    url: "/dashboard/groups",
    icon: UsersRound,
  },
  {
    title: "Etiquetas",
    url: "/dashboard/slots",
    icon: Tag,
  },
  {
    title: "Sectores",
    url: "/dashboard/sectors",
    icon: BriefcaseBusiness,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center gap-2 px-2 min-w-0",
            isCollapsed && "justify-center"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UsersRound className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold truncate">
                Organizador
              </span>
              <span className="text-xs text-muted-foreground truncate">
                de Equipos
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Navegación</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    disabled={item.disabled}
                  >
                    <Link
                      href={item.disabled ? "#" : item.url}
                      className="min-w-0"
                    >
                      <item.icon className="shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
