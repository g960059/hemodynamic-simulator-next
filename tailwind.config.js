/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Note the addition of the `app` directory.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
 
    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ...colors,
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        blue: {
          50:"#e6f2ff",
          100: "#f1f5f9",
          500: "#3ea8ff",
        }          
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "scale-in-top": {
          "0%": {
              transform: "scale(0)",
              "transform-origin": "50% 0%",
              opacity: 0
          },
          to: {
              transform: "scale(1)",
              "transform-origin": "50% 0%",
              opacity: 1
          }
        },
        "scale-out-center": {
          "0%": {
              transform: "scale(1)",
              opacity: 100
          },
          to: {
              transform: "scale(0)",
              opacity: 0
          }
        },
        "scale-in-ver-top": {
          "0%": {
              transform: "scaleY(0)",
              "transform-origin": "100% 0%",
              opacity: "0",
              display: "none"
          },
          to: {
              transform: "scaleY(1)",
              "transform-origin": "100% 0%",
              opacity: "1",
          }
        },
        "scale-out-ver-top": {
          "0%": {
              transform: "scaleY(1)",
              "transform-origin": "100% 0%",
              opacity: "1",
          },
          to: {
              transform: "scaleY(0)",
              "transform-origin": "100% 0%",
              opacity: "0",
              display: "none"
          }
        },
        "scale-in-ver-bottom": {
          "0%": {
              transform: "scaleY(0)",
              "transform-origin": "0% 100%",
              opacity: "0",
              display: "none"
          },
          to: {
              transform: "scaleY(1)",
              "transform-origin": "0% 100%",
              opacity: "1"
          }
        },
        "scale-out-ver-bottom": {
          "0%": {
              transform: "scaleY(1)",
              "transform-origin": "0% 100%",
              opacity: "1"
          },
          to: {
              transform: "scaleY(0)",
              "transform-origin": "0% 100%",
              opacity: "0",
              display: "none"
          }
        }               
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scale-in-top": "scale-in-top 0.2s cubic-bezier(0.250, 0.460, 0.450, 0.940)   both",
        "scale-out-center": "scale-out-center 0.2s cubic-bezier(0.550, 0.085, 0.680, 0.530)   both",
        "scale-in-ver-top": "scale-in-ver-top 0.2s cubic-bezier(0.250, 0.460, 0.450, 0.940)   both",
        "scale-out-ver-top": "scale-out-ver-top 0.2s cubic-bezier(0.550, 0.085, 0.680, 0.530)   both",
        "scale-in-ver-bottom": "scale-in-ver-bottom 0.2s cubic-bezier(0.250, 0.460, 0.450, 0.940)   both",
        "scale-out-ver-bottom": "scale-out-ver-bottom 0.2s cubic-bezier(0.550, 0.085, 0.680, 0.530)   both"
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
  important: true,
}