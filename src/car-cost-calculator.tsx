import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, HelpCircle } from "lucide-react";

const CarCostCalculator = () => {
    const defaultCars = [
        {
            id: 1,
            name: "Hyundai Ioniq 5 (2023 Used)",
            drivetrain: "electric",
            autoComputeEnergyCost: false,
            type: "used",
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
            excessKmCost: 0.5,
        },
        {
            id: 2,
            name: "Kia Niro PHEV (2025)",
            drivetrain: "phev",
            autoComputeEnergyCost: false,
            type: "new",
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
            excessKmCost: 0.5,
        },
        {
            id: 3,
            name: "Kia Sportage 1600 (Lease)",
            drivetrain: "gasoline",
            autoComputeEnergyCost: true,
            type: "lease",
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
            depreciationRate: 0,
        },
    ];

    const [cars, setCars] = useState(() => {
        try {
            const raw = localStorage.getItem("carCostState");
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
            const raw = localStorage.getItem("carCostState");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed.analysisYears === "number")
                    return parsed.analysisYears;
            }
        } catch (e) {
            // ignore
        }
        return 5;
    });
    const [showTooltip, setShowTooltip] = useState(null);
    const [isWide, setIsWide] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true
    );

    useEffect(() => {
        const onResize = () => setIsWide(window.innerWidth >= 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const [globalCosts, setGlobalCosts] = useState(() => {
        try {
            const raw = localStorage.getItem("carCostState");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.globalCosts) return parsed.globalCosts;
            }
        } catch (e) { }
        return { costPerLitre: 7.3, costPerKWh: 0.7 };
    });

    const [globalKmPerYear, setGlobalKmPerYear] = useState(() => {
        try {
            const raw = localStorage.getItem("carCostState");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed.globalKmPerYear === "number")
                    return parsed.globalKmPerYear;
            }
        } catch (e) { }
        return 12000;
    });

    const restoreDefaults = () => {
        if (
            !confirm(
                "לשחזר את ברירות המחדל של הרכבים וההגדרות הגלובליות? פעולה זו תחליף את הערכים הנוכחיים."
            )
        )
            return;
        setCars(defaultCars);
        setGlobalCosts({ costPerLitre: 7.3, costPerKWh: 0.7 });
        setGlobalKmPerYear(12000);
        setAnalysisYears(5);
    };

    // Persist user inputs to localStorage so changes survive reloads
    useEffect(() => {
        try {
            const state = { cars, analysisYears, globalCosts, globalKmPerYear };
            localStorage.setItem("carCostState", JSON.stringify(state));
        } catch (e) {
            // ignore storage errors (e.g., private mode)
        }
    }, [cars, analysisYears, globalCosts, globalKmPerYear]);

    const tooltips = {
        analysisYears:
            "מספר השנים שתכניסו להשתמש ברכב. תקופות ארוכות יותר מראות את היתרון האמיתי של בעלות מול ליסינג.",
        purchasePrice:
            "המחיר הכולל שתשלמו עבור הרכב. ברכבים חדשים — מחיר בחנות; ברכבים יד שניה — המחיר המוסכם; בליסינג — התשלום הראשוני/מקדמה.",
        insuranceYear1:
            "עלות ביטוח שנתית בשנה הראשונה. כולל חובה ומקיף. בדרך כלל 6,000–10,000 ש\"ח לרכבים חשמליים בישראל.",
        insuranceDecrease:
            "אחוז בו עלות הביטוח יורדת בכל שנה ככל שהרכב מתבגר. בדרך כלל 3–7% בשנה.",
        taxYear:
            "עלויות רישוי ומס שנתיות (מס רכב). נכון כיום ל-2025 לעתים 0 ש\"ח לרכבים חשמליים, אך יש לתקצב שינוי עתידי.",
        maintenancePerYear:
            "עלויות אחזקה שנתיות ממוצעות כולל טיפולים, צמיגים, בלמים וכו'. רכבים חשמליים: 1,500–2,500 ש\"ח; היברידיים: 2,500–4,000; בנזין: 3,000–5,000 ש\"ח.",
        kmPerYear:
            "כמה קילומטרים אתם נוסעים בשנה. נהג ישראלי ממוצע: 15,000–20,000 ק\"מ/שנה. משפיע משמעותית על העלויות הכוללות.",
        energyCostPerKm:
            "עלות אנרגיה/דלק לכל ק\"מ. חשמל: 0.10–0.15 ש\"ח/ק\"מ; היברידים: 0.20–0.30; בנזין: 0.40–0.60 (על בסיס מחירי חשמל ודלק בישראל).",
        costPerLitre:
            "מחיר דלק גלובלי (₪ לליטר). משמש לחישוב עלות ל-ק\"מ עבור רכבי בנזין עם נתון ק\"מ לליטר.",
        costPerKWh:
            "מחיר חשמל (₪ לקוט\"ש). משמש לחישוב עלות ל-ק\"מ עבור רכבים חשמליים עם נתוני ק\"מ להטענה ו-kWh להטענה.",
        depreciationRate:
            "אחוז הערך שהרכב מאבד בכל שנה. רכבים חדשים: 12–18% בשנה הראשונה, ואז 8–12%. רכבים יד שניה: 8–12%.",
        leaseMonthly:
            "תשלום חודשי בליסינג. כולל לרוב את עלות הרכב אך לא כולל ביטוח, אחזקה ודלק. טווח נפוץ: 2,500–5,000 ש\"ח/חודש.",
        kmLimit:
            "מקסימום קילומטרים בשנה הכלולים בליסינג. חריגה תגרור חיובים נוספים. סטנדרט: 15,000–20,000 ק\"מ/שנה.",
        excessKmCost:
            "עלות לכל ק\"מ כאשר חורגים ממגבלת הקילומטראז'. בדרך כלל 0.40–0.80 ש\"ח/ק\"מ.",
        totalCost:
            "סכום כל ההוצאות: רכישה/תשלומי ליסינג, ביטוח, מס, אחזקה ודלק/חשמל לאורך תקופת הניתוח.",
        residualValue:
            "הערכת שווי הרכב בסוף תקופת הניתוח. ניתן למכור את הרכב בסכום זה ולהחזיר חלק מהעלויות. לרכב מושכר ערך שארית 0 ש\"ח.",
        netCost:
            "העלות הנטו שלכם: עלות כוללת פחות ערך שארית. זהו העלות האמיתית שעליכם לשלם — המספר המרכזי להשוואה.",
        costPerYear:
            "העלות הנטו חלקי שנים. שימושי להשוואה להכנסה שנתית או לתקציב חודשי (לחלק ב-12).",
        costPerKm:
            "העלות הנטו חלקי סך הקילומטרים. מראה יעילות: נמוך יותר טוב.",
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
                    onClick={() => setVisible((v) => !v)}
                    tabIndex={0}
                    role="button"
                    aria-describedby={id}
                >
                    <HelpCircle size={16} className="text-blue-500 cursor-help inline" />
                </span>
                {visible &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <div
                            id={id}
                            role="tooltip"
                            className="tooltip-box"
                            onMouseEnter={show}
                            onMouseLeave={hide}
                            style={{
                                position: "fixed",
                                left: Math.round(pos.left) + "px",
                                top: Math.round(pos.top) + "px",
                                transform: "translate(-50%, -110%)",
                            }}
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

        if (car.drivetrain === "electric") {
            if (car.kmPerCharge && car.kWhPerCharge && g.costPerKWh) {
                energyCostPerKm = (car.kWhPerCharge * g.costPerKWh) / car.kmPerCharge;
            }
        } else if (car.drivetrain === "gasoline") {
            if (car.kmPerLitre && g.costPerLitre) {
                energyCostPerKm = g.costPerLitre / car.kmPerLitre;
            }
        } else if (car.drivetrain === "phev") {
            let ev = 0,
                ice = 0;
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
                lease: 0,
            },
        };

        let currentValue = car.type !== "lease" ? car.purchasePrice : 0;

        for (let year = 1; year <= years; year++) {
            let yearCost = 0;

            if (year === 1) {
                if (car.type === "lease") {
                    costs.breakdown.purchase = car.purchasePrice;
                    yearCost += car.purchasePrice;
                } else {
                    costs.breakdown.purchase = car.purchasePrice;
                    yearCost += car.purchasePrice;
                }
            }

            if (car.type === "lease") {
                const leaseYear = car.leaseMonthly * 12;
                costs.breakdown.lease += leaseYear;
                yearCost += leaseYear;
            }

            const insuranceCost =
                car.insuranceYear1 *
                Math.pow(1 - car.insuranceDecrease / 100, year - 1);
            costs.breakdown.insurance += insuranceCost;
            yearCost += insuranceCost;

            costs.breakdown.tax += car.taxYear;
            yearCost += car.taxYear;

            costs.breakdown.maintenance += car.maintenancePerYear;
            yearCost += car.maintenancePerYear;

            const kmPerYear = globalKmPerYear;

            // compute energy cost per km via shared helper
            const energyCostPerKm = computeEnergyCostPerKm(car);
            const fuelCost = kmPerYear * energyCostPerKm;

            let excessKmCost = 0;
            if (car.type === "lease" && kmPerYear > car.kmLimit) {
                excessKmCost = (kmPerYear - car.kmLimit) * car.excessKmCost;
            }

            costs.breakdown.fuel += fuelCost + excessKmCost;
            yearCost += fuelCost + excessKmCost;

            if (car.type !== "lease") {
                const yearlyDepreciation = currentValue * (car.depreciationRate / 100);
                currentValue -= yearlyDepreciation;
            }

            costs.yearly.push(yearCost);
        }

        costs.total = (Object.values(costs.breakdown) as number[]).reduce(
            (a, b) => a + b,
            0
        );

        if (car.type !== "lease") {
            costs.breakdown.depreciation =
                car.purchasePrice - Math.max(currentValue, 0);
            costs.residualValue = currentValue;
            costs.netCost = costs.total - currentValue;
        } else {
            costs.residualValue = 0;
            costs.netCost = costs.total;
        }

        return costs;
    };

    const updateCar = (id: number, field: string, value: any) => {
        setCars(
            cars.map((car: any) =>
                car.id === id ? { ...car, [field]: parseFloat(value) || 0 } : car
            )
        );
    };

    const addCar = () => {
        const newId = Math.max(...cars.map((c) => c.id)) + 1;
        setCars([
            ...cars,
            {
                id: newId,
                name: `New Car ${newId}`,
                type: "new",
                drivetrain: "electric",
                autoComputeEnergyCost: true,
                purchasePrice: 200000,
                insuranceYear1: 7000,
                insuranceDecrease: 5,
                taxYear: 0,
                maintenancePerYear: 2500,
                costPerKm: 0.2,
                depreciationRate: 12,
                leaseMonthly: 0,
                kmLimit: 20000,
                excessKmCost: 0.5,
            },
        ]);
    };

    const removeCar = (id) => {
        if (cars.length > 1) {
            setCars(cars.filter((car) => car.id !== id));
        }
    };

    const exportToCSV = () => {
    let csv = "ניתוח השוואת רכבים\n\n";

        cars.forEach((car: any) => {
            const costs = calculateTotalCost(car, analysisYears);
            csv += `${car.name}\n`;
            csv += `סוג,${car.type}\n`;
            csv += `מחיר רכישה,${car.purchasePrice}\n`;
            csv += `תקופת ניתוח,${analysisYears} שנים\n\n`;

            csv += "פירוט עלויות:\n";
            csv += `תשלום התחלתי,${costs.breakdown.purchase}\n`;
            csv += `תשלומי ליסינג,${costs.breakdown.lease.toFixed(0)}\n`;
            csv += `ביטוח,${costs.breakdown.insurance.toFixed(0)}\n`;
            csv += `מס,${costs.breakdown.tax.toFixed(0)}\n`;
            csv += `אחזקה,${costs.breakdown.maintenance.toFixed(0)}\n`;
            csv += `אנרגיה/דלק,${costs.breakdown.fuel.toFixed(0)}\n`;
            csv += `פחת,${costs.breakdown.depreciation.toFixed(0)}\n`;
            csv += `עלות כוללת,${costs.total.toFixed(0)}\n`;
            csv += `ערך שארית,${costs.residualValue.toFixed(0)}\n`;
            csv += `עלות נטו,${costs.netCost.toFixed(0)}\n`;
            csv += `עלות לשנה,${(costs.netCost / analysisYears).toFixed(0)}\n`;
            const kmForCsv =
                car.kmPerYear && Number(car.kmPerYear) > 0
                    ? Number(car.kmPerYear)
                    : globalKmPerYear;
            csv += `עלות ל-ק"מ,${(
                costs.netCost /
                (kmForCsv * analysisYears)
            ).toFixed(2)}\n\n`;

            csv += "עלויות שנתיות:\n";
            costs.yearly.forEach((cost: any, idx: number) => {
                csv += `שנה ${idx + 1},${cost.toFixed(0)}\n`;
            });
            csv += "\n\n";
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
    a.download = "ניתוח-עלויות-רכבים.csv";
        a.click();
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                מחשבון עלות רכב - ישראל
                            </h1>
                            <p className="text-gray-600 mt-2">
                                השווה את עלות ההחזקה הכוללת: חדש מול יד שניה מול ליסינג
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={restoreDefaults}
                                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                title="שחזר לברירות המחדל"
                            >
                                שחזר ברירות מחדל
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download size={20} />
                                ייצא CSV
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            תקופת ניתוח (שנים)
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    מחיר דלק (₪ / ליטר)
                                    <Tooltip id="costPerLitre-global" text={tooltips.costPerLitre} />
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={globalCosts.costPerLitre}
                                    onChange={(e) =>
                                        setGlobalCosts((g: any) => ({ ...g, costPerLitre: parseFloat(e.target.value) || 0 }))
                                    }
                                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    מחיר חשמל (₪ / קוט"ש)
                                    <Tooltip id="costPerKWh-global" text={tooltips.costPerKWh} />
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={globalCosts.costPerKWh}
                                    onChange={(e) =>
                                        setGlobalCosts((g: any) => ({ ...g, costPerKWh: parseFloat(e.target.value) || 0 }))
                                    }
                                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 w-56">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ק"מ לשנה (גלובלי)
                                <Tooltip id="globalKmPerYear" text={tooltips.kmPerYear} />
                            </label>
                            <input
                                type="number"
                                value={globalKmPerYear}
                                onChange={(e) =>
                                    setGlobalKmPerYear(Math.max(0, parseInt(e.target.value) || 0))
                                }
                                className="w-56 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        סיכום השוואת עלויות
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                        מדד
                                    </th>
                                    {cars.map((car: any) => (
                                        <th
                                            key={car.id}
                                            className="text-right py-3 px-4 font-semibold text-gray-700"
                                        >
                                            {car.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 font-medium text-gray-700">סוג</td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="text-right py-3 px-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${car.type === "new"
                                                        ? "bg-green-100 text-green-800"
                                                        : car.type === "used"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-purple-100 text-purple-800"
                                                    }`}
                                            >
                                                {car.type === "new"
                                                    ? "חדש"
                                                    : car.type === "used"
                                                        ? "יד שניה"
                                                        : "ליסינג"}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-b border-gray-200 bg-yellow-50">
                                    <td className="py-3 px-4 font-bold text-gray-800">
                                        עלות נטו (העלות האמיתית)
                                        <Tooltip id="netCost" text={tooltips.netCost} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const costs = calculateTotalCost(car, analysisYears);
                                        return (
                                            <td
                                                key={car.id}
                                                className="text-right py-3 px-4 font-bold text-gray-800"
                                            >
                                                ₪
                                                {costs.netCost
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </td>
                                        );
                                    })}
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-700">
                                        עלות לשנה
                                        <Tooltip id="costPerYear" text={tooltips.costPerYear} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const costs = calculateTotalCost(car, analysisYears);
                                        return (
                                            <td
                                                key={car.id}
                                                className="text-right py-3 px-4 text-gray-700"
                                            >
                                                ₪
                                                {(costs.netCost / analysisYears)
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </td>
                                        );
                                    })}
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-700">
                                        עלות ל-ק"מ
                                        <Tooltip id="costPerKm-summary" text={tooltips.costPerKm} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const costs = calculateTotalCost(car, analysisYears);
                                        return (
                                            <td
                                                key={car.id}
                                                className="text-right py-3 px-4 text-gray-700"
                                            >
                                                ₪
                                                {(
                                                    costs.netCost /
                                                    ((car.kmPerYear && Number(car.kmPerYear) > 0
                                                        ? Number(car.kmPerYear)
                                                        : globalKmPerYear) *
                                                        analysisYears)
                                                ).toFixed(2)}
                                            </td>
                                        );
                                    })}
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-gray-700">
                                        עלות שיורית
                                        <Tooltip
                                            id="residualValue-summary"
                                            text={tooltips.residualValue}
                                        />
                                    </td>
                                    {cars.map((car) => {
                                        const costs = calculateTotalCost(car, analysisYears);
                                        return (
                                            <td
                                                key={car.id}
                                                className="text-right py-3 px-4 text-gray-700"
                                            >
                                                ₪
                                                {costs.residualValue
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* wide-screen editable table: each car is a column */}
                {isWide && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 overflow-x-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">טבלת קלט (מסך רחב)</h3>
                        <table className="w-full table-auto">
                            <thead>
                                <tr>
                                    <th className="py-2 px-3 text-left">שדה</th>
                                    {cars.map((car: any) => (
                                        <th key={car.id} className="py-2 px-3 text-right align-top">
                                            <div className="flex items-center justify-end gap-2">
                                                <input
                                                    type="text"
                                                    value={car.name}
                                                    onChange={(e) =>
                                                        setCars(
                                                            cars.map((c: any) =>
                                                                c.id === car.id ? { ...c, name: e.target.value } : c
                                                            )
                                                        )
                                                    }
                                                    className="font-semibold text-right px-2 py-1 border-b-2 border-transparent focus:border-blue-300"
                                                />
                                                {cars.length > 1 && (
                                                    <button
                                                        onClick={() => removeCar(car.id)}
                                                        title="הסר"
                                                        className="text-sm px-2 py-1 bg-red-500 text-white rounded"
                                                    >
                                                        הסר
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t">
                                    <td className="py-2 px-3">סוג</td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <select
                                                value={car.type}
                                                onChange={(e) =>
                                                    setCars(
                                                        cars.map((c: any) =>
                                                            c.id === car.id ? { ...c, type: e.target.value } : c
                                                        )
                                                    )
                                                }
                                                className="px-2 py-1 border rounded"
                                            >
                                                <option value="new">חדש</option>
                                                <option value="used">יד שניה</option>
                                                <option value="lease">ליסינג</option>
                                            </select>
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        מחיר רכישה (₪)
                                        <Tooltip id="purchasePrice-wide" text={tooltips.purchasePrice} />
                                    </td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <input
                                                type="number"
                                                value={car.purchasePrice}
                                                onChange={(e) => updateCar(car.id, "purchasePrice", e.target.value)}
                                                className="w-40 px-2 py-1 border rounded text-right"
                                            />
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        תשלום ליסינג חודשי (₪)
                                        <Tooltip id="leaseMonthly-wide" text={tooltips.leaseMonthly} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const disabled = car.type !== "lease";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    value={car.leaseMonthly}
                                                    onChange={(e) => updateCar(car.id, "leaseMonthly", e.target.value)}
                                                    className="w-40 px-2 py-1 border rounded text-right"
                                                    disabled={disabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        שיעור פחת (% לשנה)
                                        <Tooltip id="depreciationRate-wide" text={tooltips.depreciationRate} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const disabled = car.type === "lease";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={car.depreciationRate}
                                                    onChange={(e) => updateCar(car.id, "depreciationRate", e.target.value)}
                                                    className="w-24 px-2 py-1 border rounded text-right"
                                                    disabled={disabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        ביטוח שנה 1 (₪)
                                        <Tooltip id="insuranceYear1-wide" text={tooltips.insuranceYear1} />
                                    </td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <input
                                                type="number"
                                                value={car.insuranceYear1}
                                                onChange={(e) => updateCar(car.id, "insuranceYear1", e.target.value)}
                                                className="w-40 px-2 py-1 border rounded text-right"
                                            />
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        ירידת ביטוח (% לשנה)
                                        <Tooltip id="insuranceDecrease-wide" text={tooltips.insuranceDecrease} />
                                    </td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={car.insuranceDecrease}
                                                onChange={(e) => updateCar(car.id, "insuranceDecrease", e.target.value)}
                                                className="w-24 px-2 py-1 border rounded text-right"
                                            />
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        רישוי/מס שנתי (₪)
                                        <Tooltip id="taxYear-wide" text={tooltips.taxYear} />
                                    </td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <input
                                                type="number"
                                                value={car.taxYear}
                                                onChange={(e) => updateCar(car.id, "taxYear", e.target.value)}
                                                className="w-40 px-2 py-1 border rounded text-right"
                                            />
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        אחזקה לשנה (₪)
                                        <Tooltip id="maintenancePerYear-wide" text={tooltips.maintenancePerYear} />
                                    </td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <input
                                                type="number"
                                                value={car.maintenancePerYear}
                                                onChange={(e) => updateCar(car.id, "maintenancePerYear", e.target.value)}
                                                className="w-40 px-2 py-1 border rounded text-right"
                                            />
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">סוג הנעה</td>
                                    {cars.map((car: any) => (
                                        <td key={car.id} className="py-2 px-3 text-right">
                                            <select
                                                value={car.drivetrain}
                                                onChange={(e) =>
                                                    setCars(
                                                        cars.map((c: any) =>
                                                            c.id === car.id ? { ...c, drivetrain: e.target.value } : c
                                                        )
                                                    )
                                                }
                                                className="px-2 py-1 border rounded"
                                            >
                                                <option value="electric">חשמלי</option>
                                                <option value="phev">היברידי נטען</option>
                                                <option value="gasoline">בנזין</option>
                                            </select>
                                        </td>
                                    ))}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        ק"מ להטענה
                                        <Tooltip id="kmPerCharge-wide" text={tooltips.energyCostPerKm} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const enabled = car.drivetrain === "electric" || car.drivetrain === "phev";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    value={car.kmPerCharge}
                                                    onChange={(e) => updateCar(car.id, "kmPerCharge", e.target.value)}
                                                    className="w-40 px-2 py-1 border rounded text-right"
                                                    disabled={!enabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        kWh להטענה
                                        <Tooltip id="kWhPerCharge-wide" text={tooltips.costPerKWh} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const enabled = car.drivetrain === "electric" || car.drivetrain === "phev";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={car.kWhPerCharge}
                                                    onChange={(e) => updateCar(car.id, "kWhPerCharge", e.target.value)}
                                                    className="w-40 px-2 py-1 border rounded text-right"
                                                    disabled={!enabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        ק"מ לליטר
                                        <Tooltip id="kmPerLitre-wide" text={tooltips.costPerLitre} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const enabled = car.drivetrain === "gasoline" || car.drivetrain === "phev";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={car.kmPerLitre}
                                                    onChange={(e) => updateCar(car.id, "kmPerLitre", e.target.value)}
                                                    className="w-40 px-2 py-1 border rounded text-right"
                                                    disabled={!enabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">חישוב אנרגיה אוטומטי</td>
                                    {cars.map((car: any) => {
                                        const applicable = car.drivetrain === "electric" || car.drivetrain === "phev" || car.drivetrain === "gasoline";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={car.autoComputeEnergyCost !== false}
                                                        onChange={(e) =>
                                                            setCars(
                                                                cars.map((c: any) =>
                                                                    c.id === car.id
                                                                        ? { ...c, autoComputeEnergyCost: e.target.checked }
                                                                        : c
                                                                )
                                                            )
                                                        }
                                                        // disabled={!applicable}
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            car.autoComputeEnergyCost !== false
                                                                ? computeEnergyCostPerKm(car).toFixed(3)
                                                                : car.costPerKm || 0
                                                        }
                                                            onChange={(e) => updateCar(car.id, "costPerKm", e.target.value)}
                                                            className="w-28 px-2 py-1 border rounded text-right"
                                                            disabled={!applicable || car.autoComputeEnergyCost !== false}
                                                    />
                                                </label>
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        מגבלת ק"מ לשנה
                                        <Tooltip id="kmLimit-wide" text={tooltips.kmLimit} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const disabled = car.type !== "lease";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    value={car.kmLimit}
                                                    onChange={(e) => updateCar(car.id, "kmLimit", e.target.value)}
                                                    className="w-40 px-2 py-1 border rounded text-right"
                                                    disabled={disabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr>
                                    <td className="py-2 px-3">
                                        עלות ק"מ עודף (₪/ק"מ)
                                        <Tooltip id="excessKmCost-wide" text={tooltips.excessKmCost} />
                                    </td>
                                    {cars.map((car: any) => {
                                        const disabled = car.type !== "lease";
                                        return (
                                            <td key={car.id} className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={car.excessKmCost}
                                                    onChange={(e) => updateCar(car.id, "excessKmCost", e.target.value)}
                                                    className="w-40 px-2 py-1 border rounded text-right"
                                                    disabled={disabled}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {!isWide && cars.map((car: any) => {
                    const costs = calculateTotalCost(car, analysisYears);

                    return (
                        <div
                            key={car.id}
                            className="bg-white rounded-xl shadow-lg p-6 mb-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <input
                                    type="text"
                                    value={car.name}
                                    onChange={(e) =>
                                        setCars(
                                            cars.map((c: any) =>
                                                c.id === car.id ? { ...c, name: e.target.value } : c
                                            )
                                        )
                                    }
                                    className="text-2xl font-bold text-gray-800 border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={car.type}
                                        onChange={(e) =>
                                            setCars(
                                                cars.map((c: any) =>
                                                    c.id === car.id ? { ...c, type: e.target.value } : c
                                                )
                                            )
                                        }
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="new">חדש</option>
                                        <option value="used">יד שניה</option>
                                        <option value="lease">ליסינג</option>
                                    </select>
                                    {cars.length > 1 && (
                                        <button
                                            onClick={() => removeCar(car.id)}
                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            הסר
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        פרמטרים להזנה
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {car.type === "lease"
                                                    ? "תשלום התחלתי (₪)"
                                                    : "מחיר רכישה (₪)"}
                                                <Tooltip
                                                    id={`purchasePrice-${car.id}`}
                                                    text={tooltips.purchasePrice}
                                                />
                                            </label>
                                            <input
                                                type="number"
                                                value={car.purchasePrice}
                                                onChange={(e) =>
                                                    updateCar(car.id, "purchasePrice", e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {car.type === "lease" && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        תשלומי ליסינג חודשיים (₪)
                                                        <Tooltip
                                                            id={`leaseMonthly-${car.id}`}
                                                            text={tooltips.leaseMonthly}
                                                        />
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={car.leaseMonthly}
                                                        onChange={(e) =>
                                                            updateCar(car.id, "leaseMonthly", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        מגבלת ק"מ לשנה
                                                        <Tooltip
                                                            id={`kmLimit-${car.id}`}
                                                            text={tooltips.kmLimit}
                                                        />
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={car.kmLimit}
                                                        onChange={(e) =>
                                                            updateCar(car.id, "kmLimit", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        עלות ק"מ עודף (₪/ק"מ)
                                                        <Tooltip
                                                            id={`excessKmCost-${car.id}`}
                                                            text={tooltips.excessKmCost}
                                                        />
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={car.excessKmCost}
                                                        onChange={(e) =>
                                                            updateCar(car.id, "excessKmCost", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {car.type !== "lease" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    שיעור פחת (% לשנה)
                                                    <Tooltip
                                                        id={`depreciationRate-${car.id}`}
                                                        text={tooltips.depreciationRate}
                                                    />
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={car.depreciationRate}
                                                    onChange={(e) =>
                                                        updateCar(
                                                            car.id,
                                                            "depreciationRate",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ביטוח שנה 1 (₪)
                                                <Tooltip
                                                    id={`insuranceYear1-${car.id}`}
                                                    text={tooltips.insuranceYear1}
                                                />
                                            </label>
                                            <input
                                                type="number"
                                                value={car.insuranceYear1}
                                                onChange={(e) =>
                                                    updateCar(car.id, "insuranceYear1", e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ירידת ביטוח (% לשנה)
                                                <Tooltip
                                                    id={`insuranceDecrease-${car.id}`}
                                                    text={tooltips.insuranceDecrease}
                                                />
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={car.insuranceDecrease}
                                                onChange={(e) =>
                                                    updateCar(car.id, "insuranceDecrease", e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                רישוי/מס שנתי (₪)
                                                <Tooltip
                                                    id={`taxYear-${car.id}`}
                                                    text={tooltips.taxYear}
                                                />
                                            </label>
                                            <input
                                                type="number"
                                                value={car.taxYear}
                                                onChange={(e) =>
                                                    updateCar(car.id, "taxYear", e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                אחזקה לשנה (₪)
                                                <Tooltip
                                                    id={`maintenancePerYear-${car.id}`}
                                                    text={tooltips.maintenancePerYear}
                                                />
                                            </label>
                                            <input
                                                type="number"
                                                value={car.maintenancePerYear}
                                                onChange={(e) =>
                                                    updateCar(
                                                        car.id,
                                                        "maintenancePerYear",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ק"מ לשנה (גלובלי)
                                                <Tooltip
                                                    id={`kmPerYear-${car.id}`}
                                                    text={tooltips.kmPerYear}
                                                />
                                            </label>
                                            <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-700">
                                                {globalKmPerYear.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                עלות אנרגיה ל-ק"מ (₪)
                                                <Tooltip
                                                    id={`costPerKm-${car.id}`}
                                                    text={tooltips.energyCostPerKm}
                                                />
                                            </label>
                                            <div className="flex items-center gap-3 mb-2">
                                                <label className="inline-flex items-center text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={car.autoComputeEnergyCost !== false}
                                                        onChange={(e) =>
                                                            setCars(
                                                                cars.map((c: any) =>
                                                                    c.id === car.id
                                                                        ? {
                                                                            ...c,
                                                                            autoComputeEnergyCost: e.target.checked,
                                                                        }
                                                                        : c
                                                                )
                                                            )
                                                        }
                                                        className="mr-2"
                                                    />
                                                    <span>
                                                        חישוב אוטומטי לפי סוג הנעה ומחירים גלובליים
                                                    </span>
                                                </label>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={
                                                    car.autoComputeEnergyCost !== false
                                                        ? computeEnergyCostPerKm(car).toFixed(3)
                                                        : car.costPerKm || 0
                                                }
                                                onChange={(e) =>
                                                    updateCar(car.id, "costPerKm", e.target.value)
                                                }
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${car.autoComputeEnergyCost !== false
                                                        ? "bg-gray-100 text-gray-600"
                                                        : ""
                                                    }`}
                                                disabled={car.autoComputeEnergyCost !== false}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                סוג הנעה
                                            </label>
                                            <select
                                                value={car.drivetrain}
                                                onChange={(e) =>
                                                    setCars(
                                                        cars.map((c: any) =>
                                                            c.id === car.id
                                                                ? { ...c, drivetrain: e.target.value }
                                                                : c
                                                        )
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="electric">חשמלי</option>
                                                <option value="phev">היברידי נטען</option>
                                                <option value="gasoline">בנזין</option>
                                            </select>
                                        </div>

                                        {(car.drivetrain === "electric" ||
                                            car.drivetrain === "phev") && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            ק"מ להטענה
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={car.kmPerCharge}
                                                            onChange={(e) =>
                                                                updateCar(car.id, "kmPerCharge", e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            kWh להטענה
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={car.kWhPerCharge}
                                                            onChange={(e) =>
                                                                updateCar(car.id, "kWhPerCharge", e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                        {(car.drivetrain === "gasoline" ||
                                            car.drivetrain === "phev") && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        ק"מ לליטר
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={car.kmPerLitre}
                                                        onChange={(e) =>
                                                            updateCar(car.id, "kmPerLitre", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                        פירוט עלויות ({analysisYears} שנים)
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-gray-700">
                                                {car.type === "lease"
                                                    ? "תשלום התחלתי:"
                                                    : "מחיר רכישה:"}
                                            </span>
                                            <span className="font-semibold">
                                                ₪
                                                {costs.breakdown.purchase
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </span>
                                        </div>
                                        {car.type === "lease" && (
                                                <div className="flex justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-gray-700">תשלומי ליסינג:</span>
                                                <span className="font-semibold">
                                                    ₪
                                                    {costs.breakdown.lease
                                                        .toFixed(0)
                                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                </span>
                                            </div>
                                        )}
                                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-gray-700">ביטוח:</span>
                                            <span className="font-semibold">
                                                ₪
                                                {costs.breakdown.insurance
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </span>
                                        </div>
                                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-gray-700">מס:</span>
                                            <span className="font-semibold">
                                                ₪
                                                {costs.breakdown.tax
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </span>
                                        </div>
                                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-gray-700">אחזקה:</span>
                                            <span className="font-semibold">
                                                ₪
                                                {costs.breakdown.maintenance
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </span>
                                        </div>
                                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-gray-700">אנרגיה/דלק:</span>
                                            <span className="font-semibold">
                                                ₪
                                                {costs.breakdown.fuel
                                                    .toFixed(0)
                                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </span>
                                        </div>
                                        {car.type !== "lease" && (
                                                <div className="flex justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-gray-700">פחת:</span>
                                                <span className="font-semibold">
                                                    ₪
                                                    {costs.breakdown.depreciation
                                                        .toFixed(0)
                                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t-2 border-gray-300 mt-3 pt-3">
                                            <div className="flex justify-between p-2 bg-blue-50 rounded">
                                                <span className="font-bold text-gray-800">
                                                    עלות כוללת:
                                                    <Tooltip
                                                        id={`totalCost-${car.id}`}
                                                        text={tooltips.totalCost}
                                                    />
                                                </span>
                                                <span className="font-bold text-gray-800">
                                                    ₪
                                                    {costs.total
                                                        .toFixed(0)
                                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                </span>
                                            </div>
                                            {car.type !== "lease" && (
                                                <div className="flex justify-between p-2 bg-green-50 rounded mt-2">
                                                    <span className="font-bold text-gray-800">
                                                        ערך שארית:
                                                        <Tooltip
                                                            id={`residualValue-${car.id}`}
                                                            text={tooltips.residualValue}
                                                        />
                                                    </span>
                                                    <span className="font-bold text-green-700">
                                                        ₪
                                                        {costs.residualValue
                                                            .toFixed(0)
                                                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between p-2 bg-yellow-50 rounded mt-2">
                                                <span className="font-bold text-gray-800">
                                                    עלות נטו:
                                                    <Tooltip
                                                        id={`netCost-${car.id}`}
                                                        text={tooltips.netCost}
                                                    />
                                                </span>
                                                <span className="font-bold text-orange-700">
                                                    ₪
                                                    {costs.netCost
                                                        .toFixed(0)
                                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                </span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-purple-50 rounded mt-2">
                                                    <span className="font-semibold text-gray-800">
                                                    עלות לשנה:
                                                </span>
                                                <span className="font-semibold text-purple-700">
                                                    ₪
                                                    {(costs.netCost / analysisYears)
                                                        .toFixed(0)
                                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                </span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-indigo-50 rounded mt-2">
                                                    <span className="font-semibold text-gray-800">
                                                    עלות ל-ק"מ:
                                                </span>
                                                <span className="font-semibold text-indigo-700">
                                                    ₪
                                                    {(
                                                        costs.netCost /
                                                        ((car.kmPerYear && Number(car.kmPerYear) > 0
                                                            ? Number(car.kmPerYear)
                                                            : globalKmPerYear) *
                                                            analysisYears)
                                                    ).toFixed(2)}
                                                </span>
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
                        + הוסף רכב נוסף
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        💡 טיפים לקוני רכב בישראל
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">
                                ⚡ רכבים חשמליים
                            </h3>
                            <p className="text-sm text-gray-700">
                                רכבים חשמליים כמו Ioniq 5 וטסלה נהנים מעלויות תפעול נמוכות
                                (₪0.10-0.15/ק"מ) ומטבות מס בישראל. טעינה ביתית בדרך כלל זולה יותר מתחנות ציבוריות.
                            </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">🚗 רכבים יד שניה</h3>
                            <p className="text-sm text-gray-700">
                                עלות התחלתית נמוכה יותר אך אחזקה גבוהה יותר. פחת איטי יותר
                                אך מתחילים בערך נמוך יותר. בדקו היסטוריית טיפולים ושקלו אופציות אחריות.
                            </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">📋 ליסינג</h3>
                            <p className="text-sm text-gray-700">
                                מתאים לשימוש עסקי (מוכר למס). אין ערך שארית — אתם לא תהיו בעלי הרכב.
                                שימו לב למגבלות ק"מ; תשלומי עודף (₪0.40-0.80/ק"מ) מצטברים מהר.
                            </p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2">
                                📊 תובנות מרכזיות
                            </h3>
                            <p className="text-sm text-gray-700">
                                פחת הוא לעתים קרובות העלות הגדולה ביותר! הביטוח יורד 3-7% בשנה.
                                ככל שתשמרו רכב לאורך זמן, הבעלות משתלמת יותר ביחס לליסינג.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        📖 הבנת התוצאות שלך
                    </h2>
                    <div className="space-y-4 text-gray-700">
                        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                            <h4 className="font-bold text-gray-800 mb-2">
                                🎯 עלות נטו - המספר הכי חשוב!
                            </h4>
                            <p className="text-sm">
                                זו העלות הנטו שלכם בפועל. עבור רכבים בבעלות — זו עלות כוללת
                                פחות מה שתוכלו לקבל ממכירת הרכב (ערך שארית). עבור ליסינג — זו
                                העלות הכוללת מכיוון שאינכם הבעלים בסוף התקופה. זה המספר להשוואה.
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-bold text-gray-800 mb-2">
                                💸 למה פחת חשוב
                            </h4>
                            <p className="text-sm">
                                רכב חדש מאבד 15-20% מערכו בשנה הראשונה, ואז 8-12% בשנה.
                                בטווח של 5 שנים, רכב בשווי ₪220,000 עלול להיות שווה ₪100,000 —
                                זה ₪120,000 בפחת, שלעתים קרובות הוא העלות הגדולה ביותר.
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <h4 className="font-bold text-gray-800 mb-2">
                                ⚡ חשמלי מול היברידי מול בנזין
                            </h4>
                            <p className="text-sm">
                                עלויות ריצה: חשמל ₪0.10-0.15/ק"מ, היברידי ₪0.20-0.30/ק"מ,
                                בנזין ₪0.40-0.60/ק"מ. ב-15,000 ק"מ/שנה במשך 5 שנים (75,000 ק"מ),
                                רכב חשמלי חוסך מאות עד עשרות אלפי שקלים לעומת בנזין.
                            </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                            <h4 className="font-bold text-gray-800 mb-2">
                                📅 מתי ליסינג משתלם
                            </h4>
                            <p className="text-sm">
                                ליסינג מתאים ל: שימוש עסקי (מוכר למס), צרכים לטווח קצר (2-3 שנים),
                                או למי שרוצה תמיד רכב חדש. לטווח הארוך זה יקר יותר מאשר בעלות.
                            </p>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                            <h4 className="font-bold text-gray-800 mb-2">
                                🔧 מציאות האחזקה
                            </h4>
                            <p className="text-sm">
                                רכב חשמלי דורש אחזקה מינימלית (ללא החלפת שמן, פחות בלמים).
                                היברידים דורשים טיפולים שוטפים. רכבים יד שניה דורשים יותר תחזוקה.
                                תקצבו כ-15-20% יותר לאחזקה ברכבים יד שניה לעומת חדשים.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarCostCalculator;
