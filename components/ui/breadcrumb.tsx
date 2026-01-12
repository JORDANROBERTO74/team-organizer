import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumb({ children }: { children: React.ReactNode }) {
  return <nav aria-label="breadcrumb">{children}</nav>;
}

export function BreadcrumbList({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return <ol className={cn("flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5", className)}>{children}</ol>;
}

export function BreadcrumbItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn("inline-flex items-center gap-1.5", className)}>{children}</li>;
}

export function BreadcrumbLink({
  asChild,
  href,
  children,
  className,
}: {
  asChild?: boolean;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      href={href}
      className={cn(
        "transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
    </Comp>
  );
}

export function BreadcrumbPage({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("font-normal text-foreground", className)}>{children}</span>;
}

export function BreadcrumbSeparator({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("shrink-0", className)}>
      {children ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      aria-label="More"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <span className="text-sm">...</span>
      <span className="sr-only">More</span>
    </span>
  );
}

export default Breadcrumb;
