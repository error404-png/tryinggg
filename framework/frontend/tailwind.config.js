/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#714B67', // Odoo-style Deep Violet
                    light: '#8B658B',
                    dark: '#5A3852',
                },
                secondary: {
                    DEFAULT: '#3B46F1', // Royal Blue
                },
                canvas: {
                    DEFAULT: '#F9FAFB', // Main background
                    white: '#FFFFFF',
                },
                sidebar: {
                    DEFAULT: '#2E3642', // Dark Blue-Grey
                    hover: '#3A4452',
                    active: '#3E4857',
                },
                text: {
                    primary: '#212529', // Dark Slate
                    secondary: '#666666', // Soft Gray
                },
                border: {
                    DEFAULT: '#E5E7EB', // Light Gray Border
                    focus: '#3B46F1', // Blue focus
                }
            },
            boxShadow: {
                'card': '0 4px 6px rgba(0,0,0,0.05)',
                'elevation': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
