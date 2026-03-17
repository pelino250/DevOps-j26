/**
 * Design tokens for the FleeMa design system.
 * These values should match the Tailwind configuration.
 */

export const colors = {
  primary: {
    DEFAULT: '#3B8268',
    50: '#E8F5F0',
    100: '#C5E6D9',
    200: '#9DD6C0',
    300: '#75C6A7',
    400: '#57B68F',
    500: '#3B8268',
    600: '#2F6B56',
    700: '#245444',
    800: '#183D32',
    900: '#0D2620',
  },
  secondary: {
    DEFAULT: '#F0B84A',
    50: '#FEF7E8',
    100: '#FDECC5',
    200: '#FBE09D',
    300: '#F9D475',
    400: '#F7C857',
    500: '#F0B84A',
    600: '#D9A033',
    700: '#B8872A',
    800: '#976E22',
    900: '#76561A',
  },
  background: '#F4F7F6',
  surface: '#FFFFFF',
  text: {
    primary: '#2D3748',
    secondary: '#718096',
  },
  status: {
    success: '#48BB78',
    warning: '#ED8936',
    danger: '#F56565',
    info: '#4299E1',
  },
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export const shadows = {
  card: '0 4px 20px rgba(0, 0, 0, 0.04)',
  cardHover: '0 6px 30px rgba(0, 0, 0, 0.08)',
  soft: '0 2px 15px rgba(0, 0, 0, 0.03)',
} as const;

export const typography = {
  kpi: {
    fontSize: '48px',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  kpiSm: {
    fontSize: '32px',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  heading: {
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: '600',
  },
  subheading: {
    fontSize: '20px',
    lineHeight: '1.4',
    fontWeight: '600',
  },
  body: {
    fontSize: '16px',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  caption: {
    fontSize: '13px',
    lineHeight: '1.4',
    fontWeight: '400',
  },
} as const;
