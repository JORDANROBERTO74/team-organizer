import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <span className="hidden md:inline text-xs sm:text-sm whitespace-nowrap">
        Hey, {user.email}!
      </span>
      <span className="hidden sm:inline md:hidden text-xs whitespace-nowrap">
        {user.email?.split("@")[0] || "Usuario"}
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-1 sm:gap-2">
      <Button asChild size="sm" variant={"outline"} className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
        <Link href="/auth/login">
          <span className="hidden sm:inline">Sign in</span>
          <span className="sm:hidden">Login</span>
        </Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
        <Link href="/auth/sign-up">
          <span className="hidden sm:inline">Sign up</span>
          <span className="sm:hidden">Registro</span>
        </Link>
      </Button>
    </div>
  );
}
