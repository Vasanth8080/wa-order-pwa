import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: { soft: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.08)' }
    }
  },
  plugins: []
} satisfies Config
