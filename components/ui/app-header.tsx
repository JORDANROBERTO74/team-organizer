"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { GalleryVerticalEnd, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Route to display name mapping
const routeLabels: Record<string, string> = {
  "": "Dashboard",
  // Admin routes
  admin: "Administración",
  products: "Productos",
  categories: "Categorías",
  orders: "Órdenes",
  branches: "Sucursales",
  inventory: "Inventario",
  configuration: "Configuración",
  // Settings
  settings: "Configuración",
  profile: "Perfil",
  account: "Cuenta",
  security: "Seguridad",
  preferences: "Preferencias",
  notifications: "Notificaciones",
  team: "Equipo",
  system: "Sistema",
  new: "Nuevo",
  edit: "Editar",
};

export function AppHeader() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  // Determine context (admin or ecommerce)
  const isAdminRoute = pathname.startsWith("/admin");

  // Determine if settings route
  const isSettingsRoute = pathname.startsWith("/settings");

  // Don't show header on auth pages (clients and admin) or public ecommerce pages
  const isAuthPage = pathname.startsWith("/auth");
  const isAdminAuthPage = pathname.startsWith("/admin/auth");
  const isPublicEcommercePage =
    pathname === "/" || (!isAdminRoute && !isSettingsRoute);

  if (isAuthPage || isAdminAuthPage || isPublicEcommercePage) {
    return null;
  }

  // App name and subtitle for admin
  const appName = "Tienda Multifamiliar";
  const appSubtitle = "Admin";

  // Generate breadcrumbs automatically from route
  const segments = pathname.split("/").filter(Boolean);

  // If we're at root, show only "Dashboard" (desktop only)
  if (pathname === "/") {
    return (
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div
          className={`flex items-center w-full ${
            isMobile ? "justify-between" : "gap-2"
          }`}
        >
          {isMobile ? (
            <>
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-semibold text-sm">
                    {appName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {appSubtitle}
                  </span>
                </div>
              </Link>
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={toggleSidebar}
                >
                  <Menu className="size-4" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              ) : (
                <SidebarTrigger className="-ml-1" />
              )}
            </>
          ) : (
            <>
              <SidebarTrigger className="-ml-1" />
              <div className="h-6">
                <Separator orientation="vertical" className="mr-2 h-6" />
              </div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}
        </div>
      </header>
    );
  }

  const breadcrumbs: Array<{ label: string; href?: string }> = [];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    // Last element should not have href
    if (index === segments.length - 1) {
      breadcrumbs.push({ label });
    } else {
      breadcrumbs.push({ label, href: currentPath });
    }
  });

  // Logic to collapse long breadcrumbs
  // Mobile: max 3 items, Desktop: max 4 items
  const MAX_VISIBLE_ITEMS = isMobile ? 3 : 4;
  const shouldCollapse = breadcrumbs.length > MAX_VISIBLE_ITEMS;

  // Determine which items to show
  let visibleBreadcrumbs: Array<{
    label: string;
    href?: string;
    isEllipsis?: boolean;
  }> = [];

  if (shouldCollapse) {
    const first = breadcrumbs[0];
    const last = breadcrumbs[breadcrumbs.length - 1];
    const secondToLast = breadcrumbs[breadcrumbs.length - 2];

    // Mobile (max 3): show first, ellipsis, last
    // Desktop (max 4): show first, ellipsis, second-to-last, last (if different)
    if (isMobile) {
      // Mobile: first, ellipsis, last
      visibleBreadcrumbs = [
        first, // First element
        { label: "...", isEllipsis: true }, // Ellipsis
        last, // Last (current page)
      ];
    } else {
      // Desktop: first, ellipsis, second-to-last (if different), last
      if (secondToLast && secondToLast.href !== first.href) {
        visibleBreadcrumbs = [
          first, // First element
          { label: "...", isEllipsis: true }, // Ellipsis
          secondToLast, // Second to last
          last, // Last (current page)
        ];
      } else {
        // If second-to-last equals first, show only first, ellipsis, last
        visibleBreadcrumbs = [
          first, // First element
          { label: "...", isEllipsis: true }, // Ellipsis
          last, // Last (current page)
        ];
      }
    }
  } else {
    // Show all if few items
    visibleBreadcrumbs = breadcrumbs;
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div
        className={`flex items-center w-full ${
          isMobile ? "justify-between" : "gap-2"
        }`}
      >
        {isMobile ? (
          <>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate font-semibold text-sm">
                  Tienda Multifamiliar
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Admin
                </span>
              </div>
            </Link>
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={toggleSidebar}
              >
                <Menu className="size-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            ) : (
              <SidebarTrigger className="-ml-1" />
            )}
          </>
        ) : (
          <>
            <SidebarTrigger className="-ml-1" />
            <div className="h-6">
              <Separator orientation="vertical" className="mr-2 h-6" />
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                {visibleBreadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {item.isEllipsis ? (
                        <BreadcrumbEllipsis />
                      ) : item.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < visibleBreadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>
    </header>
  );
}
