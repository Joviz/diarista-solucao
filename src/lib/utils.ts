import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

export function formatCurrencyInput(value: number): string {
  return (value / 100).toFixed(2).replace('.', ',');
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) return 0;
  return parseInt(cleaned, 10);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function addWeeks(dateStr: string, weeks: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

export function getMesAtual(): string {
  return new Date().toISOString().substring(0, 7);
}

export function addMonths(mesStr: string, months: number): string {
  const [year, month] = mesStr.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return date.toISOString().substring(0, 7);
}

export function getMesLabel(mesStr: string): string {
  const [year, month] = mesStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function generateWhatsAppMessage(cliente: string, data: string, horario: string): string {
  const dataFormatada = formatDateLong(data);
  const horaFormatada = formatTime(horario);
  return `Oi ${cliente}, ${dataFormatada} às ${horaFormatada} estarei aí para a diária. Tudo certo?`;
}

export function openWhatsApp(message: string): void {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}
