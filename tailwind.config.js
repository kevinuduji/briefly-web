/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'sans-serif',
        ],
      },
      colors: {
        briefly: {
          page: '#f6f6f7',
          surface: '#ffffff',
          border: '#e1e3e5',
          borderStrong: '#c9cccf',
          text: '#202223',
          muted: '#6d7175',
          placeholder: '#8c9196',
          green: '#008060',
          greenBg: '#f1f8f5',
          red: '#d72c0d',
          redBg: '#fff4f4',
          amber: '#b98900',
          amberBg: '#fff5ea',
          blue: '#0070f3',
          blueBg: '#f0f7ff',
        },
      },
      boxShadow: {
        brieflyCard: '0 1px 3px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};
