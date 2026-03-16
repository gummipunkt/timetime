import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kombiniert Tailwind CSS Klassen mit clsx und tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatiert Minuten in Stunden:Minuten Format
 */
export function formatMinutesToTime(minutes: number): string {
  const isNegative = minutes < 0;
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const formatted = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formatiert Minuten in lesbares Format (z.B. "8h 30min")
 */
export function formatMinutesToReadable(minutes: number): string {
  const isNegative = minutes < 0;
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}min`);
  
  const formatted = parts.length > 0 ? parts.join(" ") : "0min";
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parst einen Zeit-String (HH:MM) in Minuten seit Mitternacht
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Formatiert ein Datum in deutsches Format
 */
export function formatDateDE(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formatiert ein Datum mit Wochentag
 */
export function formatDateWithWeekday(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formatiert eine Uhrzeit
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Prüft ob ein Datum heute ist
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Ermittelt den Wochentag (0 = Montag, 6 = Sonntag)
 */
export function getWeekdayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Konvertiert Sonntag (0) zu 6
}

/**
 * Prüft ob ein Datum ein Wochenende ist
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Berechnet die Anzahl der Arbeitstage zwischen zwei Daten
 */
export function calculateWorkdays(
  startDate: Date,
  endDate: Date,
  excludeWeekends = true
): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!excludeWeekends || !isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Generiert eine zufällige Farbe für Abteilungen
 */
export function generateDepartmentColor(): string {
  const colors = [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#8B5CF6", // violet
    "#F59E0B", // amber
    "#EF4444", // red
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#84CC16", // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Kürzt einen Namen für Avatar-Initialen
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
