import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, HelpCircle } from 'lucide-react';

const CarCostCalculator = () => {
  const defaultCars = [
    {
      id: 1,
      name: 'Hyundai Ioniq 5 (2023 Used)',
      drivetrain: 'electric',
      autoComputeEnergyCost: false,
      type: 'used',
      purchasePrice: 120000,
      insuranceYear1: 9200,
      insuranceDecrease: 2,
      taxYear: 0,
      maintenancePerYear: 4000,
      kmPerYear: 12000,
      costPerKm: 0.12,
      kmPerCharge: 480,
      kWhPerCharge: 72,
      depreciationRate: 15,
      leaseMonthly: 0,
      kmLimit: 20000,
      excessKmCost: 0.5
    },
    {
      id: 2,
      name: 'Kia Niro PHEV (2025)',
      drivetrain: 'phev',
      autoComputeEnergyCost: false,
      type: 'new',
      purchasePrice: 180000,
      insuranceYear1: 6500,
      insuranceDecrease: 2,
      taxYear: 0,
      maintenancePerYear: 4000,
      kmPerYear: 15000,
      costPerKm: 0.4,
      kmPerCharge: 50,
      kWhPerCharge: 11,
      kmPerLitre: 18,
      depreciationRate: 10,
      leaseMonthly: 0,
      kmLimit: 20000,
      excessKmCost: 0.5
    },
    {
      id: 3,
      name: 'Kia Sportage 1600 (Lease)',
      drivetrain: 'gasoline',
      autoComputeEnergyCost: true,
      type: 'lease',
      purchasePrice: 2400,
      insuranceYear1: 0,
      insuranceDecrease: 0,
      taxYear: 0,
      maintenancePerYear: 0,
      kmPerYear: 15000,
      costPerKm: 0.12,
      kmPerLitre: 12,
      leaseMonthly: 2915,
      kmLimit: 20000,
      excessKmCost: 0.5,
      depreciationRate: 0
    }
  ];

  const [cars, setCars] = useState(() => {
    try {
      const raw = localStorage.getItem('carCostState');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.cars)) return parsed.cars;
      }
    } catch (e) {
      // ignore and fall back to defaults
    }
    return defaultCars;
  });

  const [analysisYears, setAnalysisYears] = useState(() => {
    try {
      const raw = localStorage.getItem('carCostState');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.analysisYears === 'number') return parsed.analysisYears;
      }
    } catch (e) {
      // ignore
    }
    return 5;
  });
  const [showTooltip, setShowTooltip] = useState(null);

  const [globalCosts, setGlobalCosts] = useState(() => {
    try {
      const raw = localStorage.getItem('carCostState');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.globalCosts) return parsed.globalCosts;
      }
    } catch (e) {}
    return { costPerLitre: 7.3, costPerKWh: 0.7 };
  });

  const [globalKmPerYear, setGlobalKmPerYear] = useState(() => {
    try {
      const raw = localStorage.getItem('carCostState');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.globalKmPerYear === 'number') return parsed.globalKmPerYear;
      }
    } catch (e) {}
    return 12000;
  });

  const restoreDefaults = () => {
    if (!confirm('Restore default cars and global settings? This will overwrite your current values.')) return;
    setCars(defaultCars);
    setGlobalCosts({ costPerLitre: 7.3, costPerKWh: 0.7 });
    setGlobalKmPerYear(12000);
    setAnalysisYears(5);
  };

  // Persist user inputs to localStorage so changes survive reloads
  useEffect(() => {
    try {
      const state = { cars, analysisYears, globalCosts, globalKmPerYear };
      localStorage.setItem('carCostState', JSON.stringify(state));
    } catch (e) {
      // ignore storage errors (e.g., private mode)
    }
  }, [cars, analysisYears, globalCosts, globalKmPerYear]);

  const tooltips = {
    analysisYears: "The number of years you plan to keep/use the car. Longer periods show the true cost advantage of ownership vs leasing.",
    purchasePrice: "Total price you pay to buy the car. For new cars, this is the showroom price. For used cars, the agreed purchase price. For leasing, this is the initial/down payment.",
    insuranceYear1: "Annual insurance cost in the first year. Includes mandatory third-party and comprehensive coverage. Typically 6,000-10,000 NIS for electric vehicles in Israel.",
    insuranceDecrease: "Percentage insurance decreases each year as the car ages. Typically 3-7% annually in Israel.",
    taxYear: "Annual ownership tax (mas rechev). Currently 0 NIS for electric vehicles in Israel through 2025, but budget for future changes.",
    maintenancePerYear: "Average yearly maintenance costs including service, tires, brakes, etc. EVs: 1,500-2,500 NIS, Hybrids: 2,500-4,000 NIS, ICE: 3,000-5,000 NIS.",
    kmPerYear: "How many kilometers you drive annually. Average Israeli driver: 15,000-20,000 km/year. This heavily impacts total costs.",
    energyCostPerKm: "Cost of energy/fuel per kilometer. EVs: 0.10-0.15 NIS/km, Hybrids: 0.20-0.30 NIS/km, Gasoline: 0.40-0.60 NIS/km (based on current Israeli electricity and fuel prices).",
    costPerLitre: "Global fuel price (₪ per litre). Used to compute energy cost per km for gasoline cars when you provide km per litre.",
    costPerKWh: "Electricity price (₪ per kWh). Used to compute energy cost per km for electric cars when you provide km per charge and kWh per charge.",
    depreciationRate: "Percentage the car loses in value each year. New cars: 12-18% first year, then 8-12%. Used cars: 8-12%. This is your biggest cost for owned vehicles!",
    leaseMonthly: "Monthly lease payment. Includes vehicle cost but typically excludes insurance, maintenance, and fuel. Common range: 2,500-5,000 NIS/month.",
    kmLimit: "Maximum kilometers per year included in lease. Exceeding this incurs extra charges. Standard: 15,000-20,000 km/year.",
    excessKmCost: "Cost per kilometer when you exceed the lease limit. Typically 0.40-0.80 NIS/km in Israel.",
    totalCost: "Sum of all expenses: purchase/lease payments, insurance, tax, maintenance, and energy costs over the analysis period.",
    residualValue: "Estimated value of the car at the end of the analysis period. You can sell it for this amount to recover some costs. Leased cars have 0 NIS residual value.",
    netCost: "Your actual out-of-pocket cost: Total Cost minus Residual Value. This is the TRUE cost of car ownership. The key number for comparison!",
    costPerYear: "Net cost divided by number of years. Useful for comparing to annual salary or budgeting monthly expenses (divide by 12).",
    costPerKm: "Net cost divided by total kilometers driven. Shows efficiency: lower is better. Helps compare different usage patterns."
  };
  const Tooltip: React.FC<{ id: string; text: string }> = ({ id, text }) => {
    const iconRef = useRef<HTMLSpanElement | null>(null);
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ left: 0, top: 0 });

    const show = () => {
      const el = iconRef.current;
      if (!el) return setVisible(true);
      const r = el.getBoundingClientRect();
      // position tooltip above the icon, centered horizontally
      setPos({ left: r.left + r.width / 2, top: r.top });
      setVisible(true);
    };
    const hide = () => setVisible(false);

    return (
      <>
        <span
          ref={iconRef}
          className="inline-block ml-1"
          onMouseEnter={show}
          onFocus={show}
          onMouseLeave={hide}
          onBlur={hide}
          onClick={() => setVisible(v => !v)}
          tabIndex={0}
          role="button"
          aria-describedby={id}
        >
          <HelpCircle size={16} className="text-blue-500 cursor-help inline" />
        </span>
        {visible && typeof document !== 'undefined' && createPortal(
          <div
            id={id}
            role="tooltip"
            className="tooltip-box"
            onMouseEnter={show}
            onMouseLeave={hide}
            style={{ position: 'fixed', left: Math.round(pos.left) + 'px', top: Math.round(pos.top) + 'px', transform: 'translate(-50%, -110%)' }}
          >
            <div className="tooltip-content">{text}</div>
            <div className="tooltip-arrow" aria-hidden="true" />
          </div>,
          document.body
        )}
      </>
    );
  };

  // Helper to compute energy/fuel cost per km from drivetrain + globalCosts
  const computeEnergyCostPerKm = (car: any): number => {
    // If autoComputeEnergyCost is explicitly false, use manual override
    if (car.autoComputeEnergyCost === false) return car.costPerKm || 0;

    const g = globalCosts || { costPerLitre: 0, costPerKWh: 0 };
    let energyCostPerKm = 0;

    if (car.drivetrain === 'electric') {
      if (car.kmPerCharge && car.kWhPerCharge && g.costPerKWh) {
        energyCostPerKm = (car.kWhPerCharge * g.costPerKWh) / car.kmPerCharge;
      }
    } else if (car.drivetrain === 'gasoline') {
      if (car.kmPerLitre && g.costPerLitre) {
        energyCostPerKm = g.costPerLitre / car.kmPerLitre;
      }
    } else if (car.drivetrain === 'phev') {
      let ev = 0, ice = 0;
      if (car.kmPerCharge && car.kWhPerCharge && g.costPerKWh) {
        ev = (car.kWhPerCharge * g.costPerKWh) / car.kmPerCharge;
      }
      if (car.kmPerLitre && g.costPerLitre) {
        ice = g.costPerLitre / car.kmPerLitre;
      }
      if (ev && ice) energyCostPerKm = (ev + ice) / 2;
      else energyCostPerKm = ev || ice || 0;
    }

    return Number.isFinite(energyCostPerKm) ? energyCostPerKm : 0;
  };

  const calculateTotalCost = (car: any, years: number): any => {
    let costs: any = {
      yearly: [],
      total: 0,
      breakdown: {
        purchase: 0,
        insurance: 0,
        tax: 0,
        maintenance: 0,
        fuel: 0,
        depreciation: 0,
        lease: 0
      }
    };

    let currentValue = car.type !== 'lease' ? car.purchasePrice : 0;

    for (let year = 1; year <= years; year++) {
      let yearCost = 0;
      
      if (year === 1) {
        if (car.type === 'lease') {
          costs.breakdown.purchase = car.purchasePrice;
          yearCost += car.purchasePrice;
        } else {
          costs.breakdown.purchase = car.purchasePrice;
          yearCost += car.purchasePrice;
        }
      }

      if (car.type === 'lease') {
        const leaseYear = car.leaseMonthly * 12;
        costs.breakdown.lease += leaseYear;
        yearCost += leaseYear;
      }

      const insuranceCost = car.insuranceYear1 * Math.pow(1 - car.insuranceDecrease / 100, year - 1);
      costs.breakdown.insurance += insuranceCost;
      yearCost += insuranceCost;

      costs.breakdown.tax += car.taxYear;
      yearCost += car.taxYear;

      costs.breakdown.maintenance += car.maintenancePerYear;
      yearCost += car.maintenancePerYear;

  // determine kilometers per year (use per-car if provided, otherwise global)
  const kmPerYear = (car.kmPerYear && Number(car.kmPerYear) > 0) ? Number(car.kmPerYear) : globalKmPerYear;

  // compute energy cost per km via shared helper
  const energyCostPerKm = computeEnergyCostPerKm(car);
  const fuelCost = kmPerYear * energyCostPerKm;
      
      let excessKmCost = 0;
      if (car.type === 'lease' && kmPerYear > car.kmLimit) {
        excessKmCost = (kmPerYear - car.kmLimit) * car.excessKmCost;
      }
      
      costs.breakdown.fuel += fuelCost + excessKmCost;
      yearCost += fuelCost + excessKmCost;

      if (car.type !== 'lease') {
        const yearlyDepreciation = currentValue * (car.depreciationRate / 100);
        currentValue -= yearlyDepreciation;
      }

      costs.yearly.push(yearCost);
    }

  costs.total = (Object.values(costs.breakdown) as number[]).reduce((a, b) => a + b, 0);
    
    if (car.type !== 'lease') {
      costs.breakdown.depreciation = car.purchasePrice - Math.max(currentValue, 0);
      costs.residualValue = currentValue;
      costs.netCost = costs.total - currentValue;
    } else {
      costs.residualValue = 0;
      costs.netCost = costs.total;
    }

    return costs;
  };

  const updateCar = (id: number, field: string, value: any) => {
    setCars(cars.map((car: any) => 
      car.id === id ? { ...car, [field]: parseFloat(value) || 0 } : car
    ));
  };

  const addCar = () => {
    const newId = Math.max(...cars.map(c => c.id)) + 1;
    setCars([...cars, {
      id: newId,
      name: `New Car ${newId}`,
      type: 'new',
        autoComputeEnergyCost: true,
      purchasePrice: 200000,
      insuranceYear1: 7000,
      insuranceDecrease: 5,
      taxYear: 0,
      maintenancePerYear: 2500,
      kmPerYear: 15000,
      costPerKm: 0.20,
      depreciationRate: 12,
      leaseMonthly: 0,
      kmLimit: 20000,
      excessKmCost: 0.5
    }]);
  };

  const removeCar = (id) => {
    if (cars.length > 1) {
      setCars(cars.filter(car => car.id !== id));
    }
  };

  const exportToCSV = () => {
    let csv = 'Car Comparison Analysis\n\n';
    
  cars.forEach((car: any) => {
      const costs = calculateTotalCost(car, analysisYears);
      csv += `${car.name}\n`;
      csv += `Type,${car.type}\n`;
      csv += `Purchase Price,${car.purchasePrice}\n`;
      csv += `Analysis Period,${analysisYears} years\n\n`;
      
      csv += 'Cost Breakdown:\n';
      csv += `Initial Payment,${costs.breakdown.purchase}\n`;
      csv += `Lease Payments,${costs.breakdown.lease.toFixed(0)}\n`;
      csv += `Insurance,${costs.breakdown.insurance.toFixed(0)}\n`;
      csv += `Tax,${costs.breakdown.tax.toFixed(0)}\n`;
      csv += `Maintenance,${costs.breakdown.maintenance.toFixed(0)}\n`;
      csv += `Fuel/Energy,${costs.breakdown.fuel.toFixed(0)}\n`;
      csv += `Depreciation,${costs.breakdown.depreciation.toFixed(0)}\n`;
      csv += `Total Cost,${costs.total.toFixed(0)}\n`;
      csv += `Residual Value,${costs.residualValue.toFixed(0)}\n`;
      csv += `Net Cost,${costs.netCost.toFixed(0)}\n`;
      csv += `Cost per Year,${(costs.netCost / analysisYears).toFixed(0)}\n`;
  const kmForCsv = (car.kmPerYear && Number(car.kmPerYear) > 0) ? Number(car.kmPerYear) : globalKmPerYear;
  csv += `Cost per KM,${(costs.netCost / (kmForCsv * analysisYears)).toFixed(2)}\n\n`;
      
      csv += 'Yearly Costs:\n';
      costs.yearly.forEach((cost: any, idx: number) => {
        csv += `Year ${idx + 1},${cost.toFixed(0)}\n`;
      });
      csv += '\n\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-cost-analysis.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Car Cost Calculator - Israel</h1>
              <p className="text-gray-600 mt-2">Compare total cost of ownership: New vs Used vs Leasing</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={restoreDefaults}
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                title="Restore default car list and global settings"
              >
                Restore Defaults
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Analysis Period (Years)
              <Tooltip id="analysisYears" text={tooltips.analysisYears} />
            </label>
            <input
              type="number"
              value={analysisYears}
              onChange={(e) => setAnalysisYears(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Price (₪ / litre)
                  <Tooltip id="costPerLitre-global" text={tooltips.costPerLitre} />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={globalCosts.costPerLitre}
                  onChange={(e) => setGlobalCosts((g: any) => ({ ...g, costPerLitre: parseFloat(e.target.value) || 0 }))}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Electricity Price (₪ / kWh)
                  <Tooltip id="costPerKWh-global" text={tooltips.costPerKWh} />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={globalCosts.costPerKWh}
                  onChange={(e) => setGlobalCosts((g: any) => ({ ...g, costPerKWh: parseFloat(e.target.value) || 0 }))}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 w-56">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM per Year (global)
                <Tooltip id="globalKmPerYear" text={tooltips.kmPerYear} />
              </label>
              <input
                type="number"
                value={globalKmPerYear}
                onChange={(e) => setGlobalKmPerYear(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-56 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cost Comparison Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                  {cars.map((car: any) => (
                    <th key={car.id} className="text-right py-3 px-4 font-semibold text-gray-700">
                      {car.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium text-gray-700">Type</td>
                  {cars.map((car: any) => (
                    <td key={car.id} className="text-right py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        car.type === 'new' ? 'bg-green-100 text-green-800' :
                        car.type === 'used' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {car.type.toUpperCase()}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-yellow-50">
                  <td className="py-3 px-4 font-bold text-gray-800">
                    Net Cost (TRUE Cost)
                    <Tooltip id="netCost" text={tooltips.netCost} />
                  </td>
                  {cars.map((car: any) => {
                    const costs = calculateTotalCost(car, analysisYears);
                    return (
                      <td key={car.id} className="text-right py-3 px-4 font-bold text-gray-800">
                        ₪{costs.netCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">
                    Cost per Year
                    <Tooltip id="costPerYear" text={tooltips.costPerYear} />
                  </td>
                  {cars.map((car: any) => {
                    const costs = calculateTotalCost(car, analysisYears);
                    return (
                      <td key={car.id} className="text-right py-3 px-4 text-gray-700">
                        ₪{(costs.netCost / analysisYears).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">
                    Cost per KM
                    <Tooltip id="costPerKm-summary" text={tooltips.costPerKm} />
                  </td>
                  {cars.map((car: any) => {
                    const costs = calculateTotalCost(car, analysisYears);
                    return (
                      <td key={car.id} className="text-right py-3 px-4 text-gray-700">
                        ₪{(costs.netCost / (((car.kmPerYear && Number(car.kmPerYear) > 0) ? Number(car.kmPerYear) : globalKmPerYear) * analysisYears)).toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">
                    Residual Value
                    <Tooltip id="residualValue-summary" text={tooltips.residualValue} />
                  </td>
                  {cars.map(car => {
                    const costs = calculateTotalCost(car, analysisYears);
                    return (
                      <td key={car.id} className="text-right py-3 px-4 text-gray-700">
                        ₪{costs.residualValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

  {cars.map((car: any) => {
          const costs = calculateTotalCost(car, analysisYears);
          
          return (
            <div key={car.id} className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  value={car.name}
                  onChange={(e) => setCars(cars.map((c: any) => 
                    c.id === car.id ? { ...c, name: e.target.value } : c
                  ))}
                  className="text-2xl font-bold text-gray-800 border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={car.type}
                    onChange={(e) => setCars(cars.map((c: any) => c.id === car.id ? { ...c, type: e.target.value } : c))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="lease">Lease</option>
                  </select>
                  {cars.length > 1 && (
                    <button
                      onClick={() => removeCar(car.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Input Parameters</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {car.type === 'lease' ? 'Initial Payment (₪)' : 'Purchase Price (₪)'}
                        <Tooltip id={`purchasePrice-${car.id}`} text={tooltips.purchasePrice} />
                      </label>
                      <input
                        type="number"
                        value={car.purchasePrice}
                        onChange={(e) => updateCar(car.id, 'purchasePrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {car.type === 'lease' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Lease Payment (₪)
                            <Tooltip id={`leaseMonthly-${car.id}`} text={tooltips.leaseMonthly} />
                          </label>
                          <input
                            type="number"
                            value={car.leaseMonthly}
                            onChange={(e) => updateCar(car.id, 'leaseMonthly', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            KM Limit per Year
                            <Tooltip id={`kmLimit-${car.id}`} text={tooltips.kmLimit} />
                          </label>
                          <input
                            type="number"
                            value={car.kmLimit}
                            onChange={(e) => updateCar(car.id, 'kmLimit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Excess KM Cost (₪/km)
                            <Tooltip id={`excessKmCost-${car.id}`} text={tooltips.excessKmCost} />
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={car.excessKmCost}
                            onChange={(e) => updateCar(car.id, 'excessKmCost', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {car.type !== 'lease' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Depreciation Rate (% per year)
                          <Tooltip id={`depreciationRate-${car.id}`} text={tooltips.depreciationRate} />
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={car.depreciationRate}
                          onChange={(e) => updateCar(car.id, 'depreciationRate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Year 1 (₪)
                        <Tooltip id={`insuranceYear1-${car.id}`} text={tooltips.insuranceYear1} />
                      </label>
                      <input
                        type="number"
                        value={car.insuranceYear1}
                        onChange={(e) => updateCar(car.id, 'insuranceYear1', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Decrease (% per year)
                        <Tooltip id={`insuranceDecrease-${car.id}`} text={tooltips.insuranceDecrease} />
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={car.insuranceDecrease}
                        onChange={(e) => updateCar(car.id, 'insuranceDecrease', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Tax (₪)
                        <Tooltip id={`taxYear-${car.id}`} text={tooltips.taxYear} />
                      </label>
                      <input
                        type="number"
                        value={car.taxYear}
                        onChange={(e) => updateCar(car.id, 'taxYear', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maintenance per Year (₪)
                        <Tooltip id={`maintenancePerYear-${car.id}`} text={tooltips.maintenancePerYear} />
                      </label>
                      <input
                        type="number"
                        value={car.maintenancePerYear}
                        onChange={(e) => updateCar(car.id, 'maintenancePerYear', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KM per Year (using global)
                        <Tooltip id={`kmPerYear-${car.id}`} text={tooltips.kmPerYear} />
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-700">{globalKmPerYear.toLocaleString()}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Energy Cost per KM (₪)
                        <Tooltip id={`costPerKm-${car.id}`} text={tooltips.energyCostPerKm} />
                      </label>
                      <div className="flex items-center gap-3 mb-2">
                        <label className="inline-flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={car.autoComputeEnergyCost !== false}
                  onChange={(e) => setCars(cars.map((c: any) => c.id === car.id ? { ...c, autoComputeEnergyCost: e.target.checked } : c))}
                            className="mr-2"
                          />
                          <span>Auto-compute from drivetrain & global prices</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={car.autoComputeEnergyCost !== false ? computeEnergyCostPerKm(car).toFixed(3) : (car.costPerKm || 0)}
                        onChange={(e) => updateCar(car.id, 'costPerKm', e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${car.autoComputeEnergyCost !== false ? 'bg-gray-100 text-gray-600' : ''}`}
                        disabled={car.autoComputeEnergyCost !== false}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Drivetrain</label>
                      <select
                        value={car.drivetrain}
                        onChange={(e) => setCars(cars.map((c: any) => c.id === car.id ? { ...c, drivetrain: e.target.value } : c))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="electric">Electric</option>
                        <option value="phev">PHEV</option>
                        <option value="gasoline">Gasoline</option>
                      </select>
                    </div>

                    {(car.drivetrain === 'electric' || car.drivetrain === 'phev') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">KM per Charge</label>
                          <input
                            type="number"
                            value={car.kmPerCharge}
                            onChange={(e) => updateCar(car.id, 'kmPerCharge', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">kWh per Charge</label>
                          <input
                            type="number"
                            step="0.1"
                            value={car.kWhPerCharge}
                            onChange={(e) => updateCar(car.id, 'kWhPerCharge', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {(car.drivetrain === 'gasoline' || car.drivetrain === 'phev') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">KM per Litre</label>
                        <input
                          type="number"
                          step="0.1"
                          value={car.kmPerLitre}
                          onChange={(e) => updateCar(car.id, 'kmPerLitre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Cost Breakdown ({analysisYears} years)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">
                        {car.type === 'lease' ? 'Initial Payment:' : 'Purchase Price:'}
                      </span>
                      <span className="font-semibold">₪{costs.breakdown.purchase.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                    {car.type === 'lease' && (
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">Lease Payments:</span>
                        <span className="font-semibold">₪{costs.breakdown.lease.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">Insurance:</span>
                      <span className="font-semibold">₪{costs.breakdown.insurance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">Tax:</span>
                      <span className="font-semibold">₪{costs.breakdown.tax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">Maintenance:</span>
                      <span className="font-semibold">₪{costs.breakdown.maintenance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">Energy/Fuel:</span>
                      <span className="font-semibold">₪{costs.breakdown.fuel.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                    {car.type !== 'lease' && (
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">Depreciation:</span>
                        <span className="font-semibold">₪{costs.breakdown.depreciation.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-gray-300 mt-3 pt-3">
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="font-bold text-gray-800">
                          Total Cost:
                          <Tooltip id={`totalCost-${car.id}`} text={tooltips.totalCost} />
                        </span>
                        <span className="font-bold text-gray-800">₪{costs.total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                      </div>
                      {car.type !== 'lease' && (
                        <div className="flex justify-between p-2 bg-green-50 rounded mt-2">
                          <span className="font-bold text-gray-800">
                            Residual Value:
                            <Tooltip id={`residualValue-${car.id}`} text={tooltips.residualValue} />
                          </span>
                          <span className="font-bold text-green-700">₪{costs.residualValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 bg-yellow-50 rounded mt-2">
                        <span className="font-bold text-gray-800">
                          Net Cost:
                          <Tooltip id={`netCost-${car.id}`} text={tooltips.netCost} />
                        </span>
                        <span className="font-bold text-orange-700">₪{costs.netCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-purple-50 rounded mt-2">
                        <span className="font-semibold text-gray-800">Cost per Year:</span>
                        <span className="font-semibold text-purple-700">₪{(costs.netCost / analysisYears).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-indigo-50 rounded mt-2">
                        <span className="font-semibold text-gray-800">Cost per KM:</span>
                        <span className="font-semibold text-indigo-700">₪{(costs.netCost / (((car.kmPerYear && Number(car.kmPerYear) > 0) ? Number(car.kmPerYear) : globalKmPerYear) * analysisYears)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="text-center">
          <button
            onClick={addCar}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            + Add Another Car
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💡 Tips for Israeli Car Buyers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">⚡ Electric Vehicles</h3>
              <p className="text-sm text-gray-700">EVs like Ioniq 5 and Tesla have lower running costs (₪0.10-0.15/km) and benefit from tax exemptions in Israel. Charging at home is much cheaper than public stations.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">🚗 Used Cars</h3>
              <p className="text-sm text-gray-700">Lower initial cost but higher maintenance. Depreciation is slower but you start with lower value. Check service history carefully and consider warranty options.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Leasing</h3>
              <p className="text-sm text-gray-700">Good for business use (tax deductible). No residual value means you never own the car. Watch KM limits - excess charges (₪0.40-0.80/km) add up quickly!</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">📊 Key Insights</h3>
              <p className="text-sm text-gray-700">Depreciation is often your biggest cost! Insurance decreases 3-7% yearly. The longer you keep a car, the better ownership becomes vs leasing.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Understanding Your Results</h2>
          <div className="space-y-4 text-gray-700">
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-bold text-gray-800 mb-2">🎯 Net Cost - The Most Important Number!</h4>
              <p className="text-sm">This is your TRUE out-of-pocket cost. For owned cars, it's Total Cost minus what you can sell the car for (Residual Value). For leases, it's just the total since you don't own anything at the end. This is the number you should compare!</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-bold text-gray-800 mb-2">💸 Why Depreciation Matters</h4>
              <p className="text-sm">A new car loses 15-20% of its value in the first year, then 8-12% yearly. Over 5 years, a ₪220,000 car might be worth only ₪100,000. That's ₪120,000 in depreciation - often your biggest cost! Used cars depreciate slower.</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-gray-800 mb-2">⚡ Electric vs Hybrid vs Gasoline</h4>
              <p className="text-sm">Running costs: Electric ₪0.10-0.15/km, Hybrid ₪0.20-0.30/km, Gasoline ₪0.40-0.60/km. Over 15,000 km/year for 5 years (75,000 km), an EV saves ₪18,750-37,500 vs gasoline!</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-bold text-gray-800 mb-2">📅 When Leasing Makes Sense</h4>
              <p className="text-sm">Leasing is good for: 1) Business use (tax deductible), 2) Short-term needs (2-3 years), 3) Always wanting a new car. It's expensive long-term because you never build equity - you're essentially renting.</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-bold text-gray-800 mb-2">🔧 Maintenance Reality</h4>
              <p className="text-sm">EVs need minimal maintenance (no oil changes, fewer brake replacements). Hybrids need regular service. Used cars need more maintenance. Budget 15-20% more for used cars vs new.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCostCalculator;
