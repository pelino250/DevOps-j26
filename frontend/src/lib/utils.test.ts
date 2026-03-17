import { describe, test, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  test('merges multiple class names', () => {
    const result = cn('px-2', 'py-1', 'bg-primary');
    expect(result).toBe('px-2 py-1 bg-primary');
  });

  test('handles conditional classes with clsx', () => {
    const condition = true;
    const result = cn('px-2', condition && 'bg-primary', 'py-1');
    expect(result).toContain('px-2');
    expect(result).toContain('bg-primary');
    expect(result).toContain('py-1');
  });

  test('filters out falsy values', () => {
    const result = cn('px-2', false && 'hidden', null, undefined, 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  test('merges conflicting Tailwind classes correctly', () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  test('handles arrays and objects', () => {
    const result = cn(['px-2', 'py-1'], { 'bg-primary': true, 'hidden': false });
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('bg-primary');
    expect(result).not.toContain('hidden');
  });

  test('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  test('preserves Tailwind arbitrary values', () => {
    const result = cn('w-[200px]', 'h-[100px]');
    expect(result).toBe('w-[200px] h-[100px]');
  });

  test('merges responsive classes correctly', () => {
    const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
    expect(result).toBe('text-sm md:text-base lg:text-lg');
  });
});
