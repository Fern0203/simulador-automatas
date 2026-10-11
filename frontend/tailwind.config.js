/** @type {import('tailwindcss').Config} */
module.exports = {
    // Archivos donde Tailwind busca las clases que usas.
    // (vis-network.min.js no se incluye: es una librería y no lleva clases de Tailwind)
    content: ['./index.html', './js/app.js', './js/grafo.js'],

    // El modo oscuro se activa con la clase "dark" en <html> (botón de tema del index)
    darkMode: 'class',

    theme: {
        extend: {
            colors: {
                brand: {
                    blue: '#1c72a5',
                    'blue-hover': '#165c85',
                    'blue-light': '#4ea5db',
                    red: '#cb3332',
                    'red-hover': '#b22b2a',
                    gold: '#b0863a',
                    'gold-hover': '#99732f',
                    'gold-light': '#dfb260'
                },
                oscuro: {
                    fondo: '#09090b',
                    tarjeta: '#121215'
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace']
            },
            keyframes: {
                aparecer: {
                    '0%': { opacity: '0', transform: 'scale(.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' }
                }
            },
            animation: {
                aparecer: 'aparecer .15s ease-out'
            }
        }
    },

    plugins: []
};
