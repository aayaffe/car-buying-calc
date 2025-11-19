module.exports = {
  plugins: {
    // Tailwind's PostCSS plugin has been moved to a separate package.
    // Use the adapter package name as the plugin key so PostCSS loads it.
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
