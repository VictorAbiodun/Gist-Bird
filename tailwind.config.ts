import type { Config } from 'tailwindcss';

// Tokens from the Figma design system, Direction B (Green-White-Green).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F3FBF5', surface: '#FFFFFF', 'surface-alt': '#E1F4E7',
        ink: '#0E2A1B', muted: '#4A6455',
        primary: '#0A7D3E', 'on-primary': '#FFFFFF',
        lemon: '#FFD23F', coral: '#FF6B57', sky: '#DFF3FF', line: '#CDE6D6', danger: '#B3261E',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { btn: '16px', input: '14px', card: '20px', sheet: '28px' },
      fontSize: { caption: ['12px', '16px'], label: ['14px', '20px'], body: ['16px', '24px'], heading: ['18px', '24px'], title: ['24px', '30px'], display: ['32px', '40px'] },
    },
  },
  plugins: [],
};
export default config;
