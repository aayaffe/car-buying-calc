import React from 'react'
import { createRoot } from 'react-dom/client'
// Import the original single-file component so we run only that file
import CarCostCalculator from './car-cost-calculator'
// Load the standalone stylesheet for this component so it looks correct without Tailwind
import './car-cost-calculator.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <CarCostCalculator />
  </React.StrictMode>
)
