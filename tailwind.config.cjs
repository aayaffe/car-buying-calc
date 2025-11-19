module.exports = {
  // Include project root files (like car-cost-calculator.tsx) so Tailwind
  // scans classes used outside of `src/` when you run a single-file app.
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}', './src/car-cost-calculator.tsx', './**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
