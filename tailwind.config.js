const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow:{
        '3xl': '0 10px 20px #4b57a936',
        'btn1':"0 0 2px #4b57a926, 0 10px 12px -4px #0009651a",
        'btn2':"0 25px 25px -10px #00096540"
      },
      maxWidth:{
        '7xl': '75rem',
      },
    },
    colors:{
      ...colors,
      blue: {
        50:"#e6f2ff",
        100: "#f1f5f9",
        500: "#3ea8ff",
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  important: '#root',
}
