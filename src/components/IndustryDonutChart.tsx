import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import StockRepo from "../classes/StockRepo";

ChartJS.register(ArcElement, Tooltip, Legend);

interface IndustryDonutChartProps {
  stockRepo: StockRepo;
}

export default function IndustryDonutChart({
  stockRepo,
}: IndustryDonutChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [dataSignature, setDataSignature] = useState<string>("");

  // Generate chart data initially
  useEffect(() => {
    const generateChartData = () => {
      const stocks = stockRepo.getStocks();

      // Create a data signature to track changes
      const newSignature = stocks
        .map((s) => `${s.industry}:${s.amount_owned}`)
        .join("|");
      setDataSignature(newSignature);

      // Calculate total portfolio value
      const total = stocks.reduce((sum, stock) => sum + stock.amount_owned, 0);
      setTotalValue(total);

      // Group stocks by industry and calculate totals
      const industryMap = stocks.reduce(
        (map, stock) => {
          const industry = stock.industry || "Unknown";
          if (!map[industry]) {
            map[industry] = 0;
          }
          map[industry] += stock.amount_owned;
          return map;
        },
        {} as Record<string, number>,
      );

      // Convert to arrays for charting
      const industryNames = Object.keys(industryMap);
      const industryValues = Object.values(industryMap);
      const percentages = industryValues.map((value) =>
        total > 0 ? parseFloat(((value / total) * 100).toFixed(2)) : 0,
      );

      // Industry-specific colors (keeping consistent coloring for industries)
      const industryColors: Record<string, string> = {
        Technology: "#36A2EB",
        Healthcare: "#FF6384",
        Finance: "#4BC0C0",
        Energy: "#FFCE56",
        Automotive: "#FF9F40",
        Agriculture: "#8AC926",
        Manufacturing: "#1982C4",
        "Consumer Cyclical": "#6A4C93",
        Entertainment: "#F7B801",
        Unknown: "#9966FF",
      };

      // Assign colors to industries
      const industryColorArray = industryNames.map(
        (industry) =>
          industryColors[industry] ||
          "#" + Math.floor(Math.random() * 16777215).toString(16),
      );

      setIndustries(industryNames);
      setValues(industryValues);
      setColors(industryColorArray);

      return {
        labels: industryNames,
        datasets: [
          {
            data: percentages,
            backgroundColor: industryColorArray,
            borderColor: industryColorArray,
            borderWidth: 1,
            hoverOffset: 15,
            cutout: "60%", // Makes it a donut chart
          },
        ],
      };
    };

    // Only generate data if we have stocks
    if (stockRepo.getStocks().length > 0) {
      setChartData(generateChartData());
    } else {
      setChartData(null);
      setIndustries([]);
      setValues([]);
      setColors([]);
      setTotalValue(0);
      setDataSignature("");
    }
  }, [stockRepo]);

  // Listen for changes to stock amounts and force update
  useEffect(() => {
    const checkForChanges = () => {
      const stocks = stockRepo.getStocks();
      const newSignature = stocks
        .map((s) => `${s.industry}:${s.amount_owned}`)
        .join("|");

      if (newSignature !== dataSignature) {
        // Data has changed, regenerate chart data
        const total = stocks.reduce(
          (sum, stock) => sum + stock.amount_owned,
          0,
        );
        setTotalValue(total);

        // Group stocks by industry and calculate totals
        const industryMap = stocks.reduce(
          (map, stock) => {
            const industry = stock.industry || "Unknown";
            if (!map[industry]) {
              map[industry] = 0;
            }
            map[industry] += stock.amount_owned;
            return map;
          },
          {} as Record<string, number>,
        );

        // Convert to arrays for charting
        const industryNames = Object.keys(industryMap);
        const industryValues = Object.values(industryMap);
        const percentages = industryValues.map((value) =>
          total > 0 ? parseFloat(((value / total) * 100).toFixed(2)) : 0,
        );

        // Industry-specific colors
        const industryColors: Record<string, string> = {
          Technology: "#36A2EB",
          Healthcare: "#FF6384",
          Finance: "#4BC0C0",
          Energy: "#FFCE56",
          Automotive: "#FF9F40",
          Agriculture: "#8AC926",
          Manufacturing: "#1982C4",
          "Consumer Cyclical": "#6A4C93",
          Entertainment: "#F7B801",
          Unknown: "#9966FF",
        };

        // Assign colors to industries
        const industryColorArray = industryNames.map(
          (industry) =>
            industryColors[industry] ||
            "#" + Math.floor(Math.random() * 16777215).toString(16),
        );

        setIndustries(industryNames);
        setValues(industryValues);
        setColors(industryColorArray);

        setChartData({
          labels: industryNames,
          datasets: [
            {
              data: percentages,
              backgroundColor: industryColorArray,
              borderColor: industryColorArray,
              borderWidth: 1,
              hoverOffset: 15,
              cutout: "60%", // Makes it a donut chart
            },
          ],
        });

        setDataSignature(newSignature);
      }
    };

    // Set up a recurring check to detect changes
    const intervalId = setInterval(checkForChanges, 100);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [stockRepo, dataSignature]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const industryIndex = context.dataIndex;
            const industryValue = values[industryIndex] || 0;
            return `${context.label}: $${industryValue.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${context.raw}%)`;
          },
        },
      },
    },
  };

  // Count number of companies per industry
  const getCompanyCountByIndustry = (industry: string) => {
    return stockRepo.getStocks().filter((stock) => stock.industry === industry)
      .length;
  };

  return (
    <div className="flex flex-col items-start w-[800px] h-[calc(100vh-200px)] ml-8 mt-7">
      <h1 className="text-4xl mb-4 w-full">Industry Allocation</h1>
      <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm flex flex-col">
        <div className="flex justify-between mb-4">
          <span className="text-gray-700 font-semibold">
            Total Value: $
            {totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
          <span className="text-gray-700 font-semibold">
            {industries.length} Industries
          </span>
        </div>

        <div className="flex-grow h-[65%] relative">
          {chartData ? (
            <Doughnut
              data={chartData}
              options={options}
              key={`donut-${dataSignature}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No stocks in portfolio
            </div>
          )}
        </div>

        <div className="mt-6 overflow-auto max-h-[30%] scrollbar-hidden">
          <div className="grid grid-cols-1 gap-3">
            {industries.map((industry, index) => {
              const industryValue = values[index] || 0;
              const percentage =
                totalValue > 0
                  ? ((industryValue / totalValue) * 100).toFixed(1)
                  : "0.0";
              const companyCount = getCompanyCountByIndustry(industry);

              return (
                <div
                  key={`${industry}-${Date.now()}-${index}`}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: colors[index] }}
                    ></div>
                    <span className="text-base">
                      {industry}{" "}
                      <span className="text-gray-500 text-sm">
                        ({companyCount}{" "}
                        {companyCount === 1 ? "company" : "companies"})
                      </span>
                    </span>
                  </div>
                  <div className="text-base">
                    <span className="font-medium">
                      $
                      {industryValue.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-500 ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
