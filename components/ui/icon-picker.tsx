"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Search, X } from "lucide-react";

// Lista de iconos comunes que pueden ser útiles para slots y sectores
const COMMON_ICONS = [
  "Clock",
  "Calendar",
  "Users",
  "User",
  "Briefcase",
  "Building",
  "Building2",
  "Home",
  // Iconos de salud y medicina
  "Hospital",
  "Stethoscope",
  "Heart",
  "HeartPulse",
  "Syringe",
  "Thermometer",
  "Pill",
  "PillBottle",
  "Bandage",
  "Cross",
  "Ambulance",
  "FirstAid",
  "Microscope",
  "Beaker",
  "Flask",
  "TestTube",
  "Dna",
  "Brain",
  "Ear",
  "Lungs",
  "Bone",
  "Activity",
  "Shield",
  "Star",
  "Bookmark",
  "Tag",
  "Flag",
  "MapPin",
  "Navigation",
  "Compass",
  "Zap",
  "Sun",
  "Moon",
  "Cloud",
  "Droplet",
  "Flame",
  "Sparkles",
  "Rocket",
  "Plane",
  "Car",
  "Truck",
  "Bike",
  "Ship",
  "Phone",
  "Mail",
  "MessageSquare",
  "Bell",
  "Settings",
  "Wrench",
  "Tool",
  "Package",
  "Box",
  "Archive",
  "Folder",
  "File",
  "FileText",
  "Image",
  "Video",
  "Music",
  "Headphones",
  "Monitor",
  "Laptop",
  "Mouse",
  "Keyboard",
  "Gamepad2",
  "Palette",
  "Brush",
  "PenTool",
  "Scissors",
  "Hammer",
  "GitBranch",
  "Code",
  "Database",
  "Server",
  "Cpu",
  "HardDrive",
  "Wifi",
  "Radio",
  "Tv",
  "Camera",
  "Mic",
  "Volume2",
  "CheckCircle",
  "XCircle",
  "AlertCircle",
  "Info",
  "HelpCircle",
  "Plus",
  "Minus",
  "X",
  "Check",
  "ArrowRight",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "ChevronRight",
  "ChevronLeft",
  "ChevronUp",
  "ChevronDown",
  "TrendingUp",
  "TrendingDown",
  "PieChart",
  "BarChart3",
  "LineChart",
  "ShoppingCart",
  "CreditCard",
  "Wallet",
  "Coins",
  "Banknote",
  "Receipt",
  "Ticket",
  "Gift",
  "Crown",
  "Award",
  "Medal",
  "Target",
  "Crosshair",
  "Focus",
  "Eye",
  "EyeOff",
  "Lock",
  "Unlock",
  "Key",
  "Fingerprint",
  "Scan",
  "QrCode",
] as const;

interface IconPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function IconPicker({
  value,
  onValueChange,
  disabled,
  className,
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Obtener el icono actual
  const CurrentIcon = React.useMemo(() => {
    if (!value) return null;
    try {
      const IconComponent = (
        LucideIcons as unknown as Record<string, LucideIcon>
      )[value as string];
      return IconComponent;
    } catch {
      return null;
    }
  }, [value]);

  // Filtrar iconos basado en la búsqueda
  const filteredIcons = React.useMemo(() => {
    if (!search.trim()) return COMMON_ICONS;

    const searchLower = search.toLowerCase();
    return COMMON_ICONS.filter((iconName) =>
      iconName.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const handleSelectIcon = (iconName: string) => {
    onValueChange(iconName);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 h-10 pr-8",
              !value && "text-muted-foreground",
              className
            )}
          >
            {CurrentIcon ? (
              <>
                <CurrentIcon className="h-4 w-4" />
                <span className="flex-1 text-left truncate">{value}</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 opacity-50" />
                <span className="flex-1 text-left">Seleccionar icono...</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-accent z-10"
            aria-label="Limpiar icono"
          >
            <X className="h-3 w-3 opacity-50 hover:opacity-100" />
          </button>
        )}
      </div>
      <PopoverContent className="w-[300px] p-0">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar icono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-2">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.map((iconName) => {
                const IconComponent = (
                  LucideIcons as unknown as Record<string, LucideIcon>
                )[iconName];
                if (!IconComponent) return null;

                const isSelected = value === iconName;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelectIcon(iconName)}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md border transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected &&
                        "bg-primary text-primary-foreground border-primary",
                      "disabled:opacity-50 disabled:pointer-events-none"
                    )}
                    disabled={disabled}
                    title={iconName}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No se encontraron iconos
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
