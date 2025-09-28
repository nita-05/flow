/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blue & White theme
        primary: {
          DEFAULT: '#00ABE4', // Bright blue
          50: '#E9F1FA',
          100: '#D7EEF9',
          200: '#BFE6F7',
          300: '#95D9F2',
          400: '#65C9EC',
          500: '#35B9E6',
          600: '#0FB0E3',
          700: '#00A2D4',
          800: '#0090BD',
          900: '#00ABE4',
        },
        secondary: {
          DEFAULT: '#E9F1FA', // Light blue background
          50: '#FFFFFF',
          100: '#FAFCFF',
          200: '#F2F8FE',
          300: '#E9F1FA',
          400: '#DDEBFA',
          500: '#CFE3F7',
          600: '#B9D7F2',
          700: '#9EC7EB',
          800: '#84B7E4',
          900: '#6AA7DD',
        },
        accent: {
          DEFAULT: '#007BB8', // Deeper blue for accents
          50: '#E6F4FB',
          100: '#CCE9F7',
          200: '#99D3EF',
          300: '#66BDE7',
          400: '#33A7DF',
          500: '#0F92D7',
          600: '#007BB8',
          700: '#00689B',
          800: '#00567F',
          900: '#004664',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'section': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(26 26 46 / 0.05)',
        'medium': '0 4px 6px -1px rgb(26 26 46 / 0.1)',
        'large': '0 10px 15px -3px rgb(26 26 46 / 0.1)',
        'xl': '0 20px 25px -5px rgb(26 26 46 / 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
