// Utilidades para formatear fechas

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) {
    return dateString; // Retornar el string original si la fecha es inválida
  }
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) {
    return dateString; // Retornar el string original si la fecha es inválida
  }
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timeString: string | null): string {
  if (!timeString) return "";
  return timeString.substring(0, 5); // HH:MM
}

export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function getMonthStart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function getMonthEnd(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(
    2,
    "0"
  )}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateString}`);
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}
