import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import StockRepo from "../classes/StockRepo";

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface StockBarChartProps {
  stockRepo: StockRepo;
}

export default function StockBarChart({ stockRepo }: StockBarChartProps) {
  // State to hold chart data
  const [chartData, setChartData] = useState<any>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [dataSignature, setDataSignature] = useState<string>("");

  // Update chart data when stockRepo changes
  useEffect(() => {
    const generateChartData = () => {
      const stocks = stockRepo
        .getStocks()
        .sort((a, b) => b.amount_owned - a.amount_owned); // Sort by amount owned

      // Create a data signature to track changes
      const newSignature = stocks
        .map((s) => `${s.name}:${s.amount_owned}`)
        .join("|");
      setDataSignature(newSignature);

      // Calculate total portfolio value
      const total = stocks.reduce((sum, stock) => sum + stock.amount_owned, 0);
      setTotalValue(total);

      // Prepare bar chart data - stock names as labels, amount owned as data
      const labels = stocks.map((stock) => stock.name);
      const data = stocks.map((stock) => stock.amount_owned);

      // Assign colors (using the same color palette as in other chart components)
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
            label: "Amount Invested ($)",
            data,
            backgroundColor: colors,
            borderColor: colors.map((color) => color),
            borderWidth: 1,
            barThickness: 30,
            maxBarThickness: 40,
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
  }, [stockRepo]);

  // Listen for changes to stock amounts and force update
  useEffect(() => {
    const checkForChanges = () => {
      const stocks = stockRepo
        .getStocks()
        .sort((a, b) => b.amount_owned - a.amount_owned);
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

        // Prepare bar chart data
        const labels = stocks.map((stock) => stock.name);
        const data = stocks.map((stock) => stock.amount_owned);

        // Assign colors
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
              label: "Amount Invested ($)",
              data,
              backgroundColor: colors,
              borderColor: colors.map((color) => color),
              borderWidth: 1,
              barThickness: 30,
              maxBarThickness: 40,
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
    indexAxis: "y" as const, // Horizontal bar chart
    plugins: {
      legend: {
        display: false, // Hide legend since it's self-explanatory
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const stockIndex = context.dataIndex;
            const stockAmount =
              stockRepo
                .getStocks()
                .sort((a, b) => b.amount_owned - a.amount_owned)[stockIndex]
                ?.amount_owned || 0;
            const percentage =
              totalValue > 0
                ? ((stockAmount / totalValue) * 100).toFixed(1)
                : "0.0";
            return `$${stockAmount.toLocaleString()} (${percentage}% of portfolio)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value: any) => {
            return "$" + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-start w-[800px] h-[calc(100vh-200px)] ml-8 mt-7">
      <h1 className="text-4xl mb-4 w-full">Investment Breakdown</h1>
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

        <div className="flex-grow h-[65%] relative">
          {chartData ? (
            <Bar
              data={chartData}
              options={options}
              key={`bar-${dataSignature}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No stocks in portfolio
            </div>
          )}
        </div>

        <div className="mt-6 overflow-auto max-h-[30%] scrollbar-hidden">
          <div className="grid grid-cols-1 gap-3">
            {stockRepo
              .getStocks()
              .sort((a, b) => b.amount_owned - a.amount_owned)
              .map((stock, index) => {
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
                      <span className="text-gray-500 ml-2">
                        ({percentage}%)
                      </span>
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
