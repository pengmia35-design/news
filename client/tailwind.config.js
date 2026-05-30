/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent-foreground)',
        },
        border: 'var(--color-border)',
        ring: 'var(--color-ring)',
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', '"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      spacing: {
        'section': 'var(--spacing-section)',
        'page-x': 'var(--spacing-page-x)',
        'page-y': 'var(--spacing-page-y)',
      },
      borderRadius: {
        'card': 'var(--card-radius)',
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
        'glow': 'var(--glow-primary)',
        'glow-cyan': 'var(--glow-cyan)',
        'glow-violet': 'var(--glow-violet)',
      },
    },
  },
  plugins: [],
}
