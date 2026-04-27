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
                    300: '#F2EFE9', // Platinum/Off-white
                    400: '#E5E4E2', // Platinum
                    500: '#D4AF37', // Classic Champagne Gold
                    600: '#AA8C2C', // Darker Gold
                },
                surface: {
                    950: '#000000', // Pure Black
                    900: '#0A0A0A', // Near Black
                    800: '#111111', // Very Dark Grey
                    700: '#1A1A1A',
                },
                sage: {
                    400: '#4ADE80', // Brighter status green
                    500: '#22C55E',
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
