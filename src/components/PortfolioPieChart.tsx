import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import StockRepo from "../classes/StockRepo";

// Register the required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioPieChartProps {
  stockRepo: StockRepo;
}

export default function PortfolioPieChart({
  stockRepo,
}: PortfolioPieChartProps) {
  // State to hold chart data
  const [chartData, setChartData] = useState<any>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [dataSignature, setDataSignature] = useState<string>("");

  // Update chart data whenever stockRepo changes
  useEffect(() => {
    const generateChartData = () => {
      const stocks = stockRepo.getStocks();

      // Create a data signature to track changes
      const newSignature = stocks
        .map((s) => `${s.name}:${s.amount_owned}`)
        .join("|");
      setDataSignature(newSignature);

      // Calculate total portfolio value
      const total = stocks.reduce((sum, stock) => sum + stock.amount_owned, 0);
      setTotalValue(total);

      // Generate labels and data
      const labels = stocks.map((stock) => stock.name);
      const data = stocks.map((stock) => {
        const percentage = total > 0 ? (stock.amount_owned / total) * 100 : 0;
        return parseFloat(percentage.toFixed(2));
      });

      // Generate background colors
      const backgroundColors = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#8AC926",
        "#1982C4",
        "#6A4C93",
        "#F7B801",
      ];

      const colors = stocks.map(
        (_, index) => backgroundColors[index % backgroundColors.length],
      );

      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1,
          },
        ],
      };
    };

    // Only generate data if we have stocks
    if (stockRepo.getStocks().length > 0) {
      setChartData(generateChartData());
    } else {
      setChartData(null);
      setTotalValue(0);
      setDataSignature("");
    }
  }, [stockRepo]); // We'll rely on the component re-rendering to detect changes

  // Listen for changes to stock amounts and force update
  useEffect(() => {
    const checkForChanges = () => {
      const stocks = stockRepo.getStocks();
      const newSignature = stocks
        .map((s) => `${s.name}:${s.amount_owned}`)
        .join("|");

      if (newSignature !== dataSignature) {
        // Data has changed, regenerate chart data
        const total = stocks.reduce(
          (sum, stock) => sum + stock.amount_owned,
          0,
        );
        setTotalValue(total);

        // Generate labels and data
        const labels = stocks.map((stock) => stock.name);
        const data = stocks.map((stock) => {
          const percentage = total > 0 ? (stock.amount_owned / total) * 100 : 0;
          return parseFloat(percentage.toFixed(2));
        });

        const backgroundColors = [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8AC926",
          "#1982C4",
          "#6A4C93",
          "#F7B801",
        ];

        const colors = stocks.map(
          (_, index) => backgroundColors[index % backgroundColors.length],
        );

        setChartData({
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1,
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
            const stockIndex = context.dataIndex;
            const stockAmount =
              stockRepo.getStocks()[stockIndex]?.amount_owned || 0;
            return `${context.label}: $${stockAmount.toLocaleString()} (${context.raw}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-start w-[800px] h-[calc(100vh-200px)] ml-8 mt-7">
      <h1 className="text-4xl mb-4 w-full">Portfolio Composition</h1>
      <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm flex flex-col">
        <div className="flex justify-between mb-4">
          <span className="text-gray-700 font-semibold">
            Total Value: $
            {totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
          <span className="text-gray-700 font-semibold">
            {stockRepo.getStocks().length} Stocks
          </span>
        </div>

        {/* Make chart bigger */}
        <div className="flex-grow h-[65%] relative">
          {chartData ? (
            <Pie
              data={chartData}
              options={options}
              key={`pie-${dataSignature}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No stocks in portfolio
            </div>
          )}
        </div>

        <div className="mt-6 overflow-auto max-h-[30%] scrollbar-hidden">
          <div className="grid grid-cols-1 gap-3">
            {stockRepo.getStocks().map((stock, index) => {
              const percentage =
                totalValue > 0
                  ? ((stock.amount_owned / totalValue) * 100).toFixed(1)
                  : "0.0";

              // Get color from chart data or use fallback
              const color =
                chartData?.datasets[0]?.backgroundColor[index] || "#CCCCCC";

              return (
                <div
                  key={`${stock.name}-${stock.amount_owned}`}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-base">{stock.name}</span>
                  </div>
                  <div className="text-base">
                    <span className="font-medium">
                      $
                      {stock.amount_owned.toLocaleString("en-US", {
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
