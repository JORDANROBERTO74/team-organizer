"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, UsersRound, Clock, Calendar } from "lucide-react";
import { Separator } from "../ui/separator";

const routeLabels: Record<
  string,
  { label: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  groups: { label: "Grupos", icon: UsersRound },
  slots: { label: "Slots", icon: Clock },
  sectors: { label: "Sectores", icon: Calendar },
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  // Construir breadcrumbs dinámicamente
  const breadcrumbItems: React.ReactNode[] = [];

  paths.forEach((path, index) => {
    const isLast = index === paths.length - 1;
    const href = "/" + paths.slice(0, index + 1).join("/");
    const routeInfo = routeLabels[path];

    if (isLast) {
      // Último item: página actual (no clickeable)
      breadcrumbItems.push(
        <BreadcrumbItem key={href}>
          {routeInfo ? (
            <BreadcrumbPage className="flex items-center gap-2">
              {routeInfo.icon && <routeInfo.icon className="h-4 w-4" />}
              {routeInfo.label}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbPage className="capitalize">{path}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      );
    } else {
      // Item intermedio: link clickeable
      breadcrumbItems.push(
        <BreadcrumbItem key={href}>
          <BreadcrumbLink asChild>
            <Link href={href} className="flex items-center gap-2">
              {routeInfo?.icon && <routeInfo.icon className="h-4 w-4" />}
              {routeInfo?.label || path}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      );
      // Agregar separador después de cada item que no sea el último
      breadcrumbItems.push(<BreadcrumbSeparator key={`sep-${index}`} />);
    }
  });

  return (
    <div className="hidden md:flex items-center gap-2">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
