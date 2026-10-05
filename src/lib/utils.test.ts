import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatTime,
  generateWhatsAppMessage,
  getWeekStart,
  addWeeks,
  getMesAtual,
  addMonths,
  getMesLabel,
} from '@/lib/utils';

describe('lib/utils', () => {
  describe('formatCurrency', () => {
    it('formats centavos to BRL currency', () => {
      expect(formatCurrency(100)).toBe('R$\u00A01,00');
      expect(formatCurrency(1500)).toBe('R$\u00A015,00');
      expect(formatCurrency(123456)).toBe('R$\u00A01.234,56');
    });
  });

  describe('formatDate', () => {
    it('formats YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(formatDate('2026-10-05')).toBe('05/10/2026');
      expect(formatDate('2026-01-15')).toBe('15/01/2026');
    });
  });

  describe('formatTime', () => {
    it('formats HH:mm:ss to HH:mm', () => {
      expect(formatTime('08:00:00')).toBe('08:00');
      expect(formatTime('14:30:00')).toBe('14:30');
    });
  });

  describe('generateWhatsAppMessage', () => {
    it('generates confirmation message', () => {
      const message = generateWhatsAppMessage('Maria', '2026-10-07', '08:00');
      expect(message).toContain('Maria');
      expect(message).toContain('08:00');
      expect(message).toContain('diária');
    });
  });

  describe('getWeekStart', () => {
    it('returns Monday of current week', () => {
      const weekStart = getWeekStart(new Date('2026-10-07')); // Wednesday
      expect(weekStart).toBe('2026-10-05'); // Monday
    });
  });

  describe('addWeeks', () => {
    it('adds weeks to a date', () => {
      expect(addWeeks('2026-10-05', 1)).toBe('2026-10-12');
      expect(addWeeks('2026-10-05', -1)).toBe('2026-09-28');
    });
  });

  describe('getMesAtual', () => {
    it('returns current month in YYYY-MM format', () => {
      const mes = getMesAtual();
      expect(mes).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('addMonths', () => {
    it('adds months to a month string', () => {
      expect(addMonths('2026-10', 1)).toBe('2026-11');
      expect(addMonths('2026-10', -1)).toBe('2026-09');
      expect(addMonths('2026-12', 1)).toBe('2027-01');
    });
  });

  describe('getMesLabel', () => {
    it('formats month to Portuguese label', () => {
      expect(getMesLabel('2026-10')).toBe('outubro de 2026');
      expect(getMesLabel('2026-01')).toBe('janeiro de 2026');
    });
  });
});
