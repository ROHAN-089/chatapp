// filepath: d:\project1\chatapp\frontend\tailwind.config.js
/** 
 * 
 
 * @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [daisyui],
    daisyui: {
        themes: "all", // Enable all themes
    },
}