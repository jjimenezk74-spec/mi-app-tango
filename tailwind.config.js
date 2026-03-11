/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        yerba: {
          DEFAULT: "hsl(var(--yerba))",
          50: "hsl(142 40% 96%)",
          100: "hsl(142 40% 90%)",
          200: "hsl(142 40% 80%)",
          300: "hsl(142 40% 65%)",
          400: "hsl(142 40% 50%)",
          500: "hsl(142 40% 40%)",
          600: "hsl(142 40% 35%)",
          700: "hsl(142 40% 28%)",
          800: "hsl(142 40% 22%)",
          900: "hsl(142 40% 15%)",
        },
        wood: {
          DEFAULT: "hsl(var(--wood))",
          50: "hsl(32 40% 96%)",
          100: "hsl(32 40% 90%)",
          200: "hsl(32 40% 80%)",
          300: "hsl(32 40% 65%)",
          400: "hsl(32 40% 50%)",
          500: "hsl(32 40% 40%)",
          600: "hsl(32 40% 35%)",
          700: "hsl(32 40% 28%)",
          800: "hsl(32 40% 22%)",
          900: "hsl(32 40% 15%)",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          50: "hsl(43 74% 96%)",
          100: "hsl(43 74% 88%)",
          200: "hsl(43 74% 78%)",
          300: "hsl(43 74% 65%)",
          400: "hsl(43 74% 55%)",
          500: "hsl(43 74% 49%)",
          600: "hsl(43 74% 42%)",
          700: "hsl(43 74% 35%)",
          800: "hsl(43 74% 28%)",
          900: "hsl(43 74% 20%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "4xl": "2rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
