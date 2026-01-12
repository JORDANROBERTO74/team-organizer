"use client";

import { useState } from "react";
import { useSignOut } from "@/hooks/auth/use-sign-out";
import { Button } from "@/components/ui/button";
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

export function LogoutButton() {
  const { signOut, isPending } = useSignOut({ refresh: true, redirectTo: "/" });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowLogoutDialog(true)}
        size="sm"
        className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 whitespace-nowrap"
        disabled={isPending}
      >
        <span className="hidden sm:inline">
          {isPending ? "Cerrando..." : "Cerrar sesión"}
        </span>
        <span className="sm:hidden">
          {isPending ? "Saliendo..." : "Salir"}
        </span>
      </Button>
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
    </>
  );
}
