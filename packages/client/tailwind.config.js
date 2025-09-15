"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    darkMode: ["class"],
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                'border-subtle': 'hsl(var(--border-subtle))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                canvas: 'hsl(var(--canvas))',
                'canvas-grid': 'hsl(var(--canvas-grid))',
                surface: 'hsl(var(--surface))',
                'surface-elevated': 'hsl(var(--surface-elevated))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    hover: 'hsl(var(--primary-hover))',
                    active: 'hsl(var(--primary-active))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    hover: 'hsl(var(--secondary-hover))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))'
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                subtle: 'hsl(var(--subtle))',
                accent: {
                    blue: 'hsl(var(--accent-blue))',
                    purple: 'hsl(var(--accent-purple))',
                    green: 'hsl(var(--accent-green))',
                    orange: 'hsl(var(--accent-orange))',
                    red: 'hsl(var(--accent-red))',
                    yellow: 'hsl(var(--accent-yellow))',
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                presence: {
                    '1': 'hsl(var(--presence-1))',
                    '2': 'hsl(var(--presence-2))',
                    '3': 'hsl(var(--presence-3))',
                    '4': 'hsl(var(--presence-4))',
                    '5': 'hsl(var(--presence-5))',
                    '6': 'hsl(var(--presence-6))'
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                base: 'var(--shadow-base)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)'
            },
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-surface': 'var(--gradient-surface)'
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
