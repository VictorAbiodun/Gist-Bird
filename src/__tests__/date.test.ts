import { describe, it, expect } from 'vitest';
import { formatMessageTime, formatDateDivider } from '../lib/date';

describe('formatMessageTime', () => {
  it('formats ISO string to 12-hour time', () => {
    const formatted = formatMessageTime('2026-11-25T13:45:00.000Z');
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });

  it('handles invalid or empty strings gracefully', () => {
    expect(formatMessageTime('')).toBe('');
    expect(formatMessageTime(null)).toBe('');
    expect(formatMessageTime('invalid-date')).toBe('');
  });
});

describe('formatDateDivider', () => {
  it('identifies today', () => {
    const today = new Date().toISOString();
    expect(formatDateDivider(today)).toBe('Today');
  });

  it('identifies yesterday', () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    expect(formatDateDivider(y.toISOString())).toBe('Yesterday');
  });

  it('handles older dates', () => {
    const formatted = formatDateDivider('2020-01-15T12:00:00.000Z');
    expect(formatted).toContain('2020');
    expect(formatted).toMatch(/Jan/i);
    expect(formatted).toMatch(/15/);
  });
});
