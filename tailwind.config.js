/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
            },
            colors: {
                accent: {
                    300: '#e8dcc8',
                    400: '#d4c4a8',
                    500: '#bfa882',
                    600: '#a8916b',
                },
                surface: {
                    950: '#0a0a0a',
                    900: '#111111',
                    800: '#1a1a1a',
                    700: '#242424',
                },
                sage: {
                    400: '#7a9e7e',
                    500: '#5e8562',
                },
                warm: {
                    50: '#fffcf5',
                    100: '#faf5eb',
                    200: '#f0e8d8',
                },
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            }
        },
    },
    plugins: [],
}
