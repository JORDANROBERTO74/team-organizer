"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/contexts/user-context";
import { useSignOut } from "@/hooks/auth/use-sign-out";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Moon, Sun, Laptop } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarUserMenu() {
  const { user, userProfile, loading } = useUserContext();
  const { signOut, isPending } = useSignOut({ refresh: true, redirectTo: "/" });
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Obtener iniciales del nombre o email
  const getInitials = () => {
    if (userProfile?.full_name) {
      const names = userProfile.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return userProfile.full_name.substring(0, 2).toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Obtener nombre para mostrar
  const getDisplayName = () => {
    return userProfile?.full_name || userProfile?.email || "Usuario";
  };

  // Obtener email para mostrar
  const getDisplayEmail = () => {
    return userProfile?.email || "";
  };

  if (loading) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton 
          size="lg" 
          className="data-[state=open]:bg-sidebar-accent"
        >
          <div className={cn(
            "rounded-lg bg-muted animate-pulse shrink-0",
            isCollapsed ? "h-7 w-7" : "h-8 w-8"
          )} />
          {!isCollapsed && (
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (!user) {
    return null;
  }

  const currentTheme = mounted ? theme : "system";

  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            size="lg"
            tooltip={isCollapsed ? getDisplayName() : undefined}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className={cn(
              "shrink-0 flex items-center justify-center overflow-hidden",
              isCollapsed ? "h-7 w-7" : "h-8 w-8"
            )}>
              <AvatarImage
                src={userProfile?.avatar_url}
                alt={getDisplayName()}
                className="rounded-lg object-cover"
              />
              <AvatarFallback className={cn(
                "rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full",
                isCollapsed ? "text-[10px]" : "text-xs"
              )}>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-left">
                <span className="text-sm font-semibold truncate">
                  {getDisplayName()}
                </span>
                {getDisplayEmail() && (
                  <span className="text-xs text-muted-foreground truncate">
                    {getDisplayEmail()}
                  </span>
                )}
              </div>
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align={isCollapsed ? "center" : "end"}
        side={isCollapsed ? "right" : "top"}
        sideOffset={8}
      >
        <div className="space-y-1">
          {/* Información del usuario */}
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={userProfile?.avatar_url}
                  alt={getDisplayName()}
                />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm font-semibold truncate">
                  {getDisplayName()}
                </span>
                {getDisplayEmail() && (
                  <span className="text-xs text-muted-foreground truncate">
                    {getDisplayEmail()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Separator />
          
          {/* Opción de tema */}
          {mounted && (
            <>
              <div className="px-1 py-1">
                <div className="text-xs font-semibold px-2 py-1.5 text-muted-foreground">
                  Tema
                </div>
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setTheme("light");
                      setOpen(false);
                    }}
                  >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {currentTheme === "light" && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setTheme("dark");
                      setOpen(false);
                    }}
                  >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {currentTheme === "dark" && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setTheme("system");
                      setOpen(false);
                    }}
                  >
                    <Laptop className="h-4 w-4" />
                    <span>System</span>
                    {currentTheme === "system" && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Cerrar sesión */}
          <div className="px-1 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setShowLogoutDialog(true);
                setOpen(false);
              }}
              disabled={isPending}
            >
              <LogOut className="h-4 w-4" />
              <span>{isPending ? "Cerrando..." : "Cerrar sesión"}</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={signOut}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Cerrando..." : "Cerrar sesión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
    </SidebarMenuItem>
  );
}
