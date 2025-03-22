import TrashIcon from "./TrashIcon.tsx";
import NewsIcon from "./NewsIcon.tsx";
import PriceIcon from "./PriceIcon.tsx";
import WalletIcon from "./WalletIcon.tsx";
import RedArrowIcon from "./RedArrowIcon.tsx";
import GreenArrowIcon from "./GreenArrowIcon.tsx";
import StockRepo from "../classes/StockRepo.ts";
import Stock from "../classes/Stock.ts";
import { ChangeEvent, KeyboardEvent, useState } from "react";
import CompanyIcon from "./CompanyIcon.tsx";

interface Properties {
  stockRepo: StockRepo;
  darkMode?: boolean;
  onRemove: (stock: Stock) => void;
  onSelect: (stock: Stock) => void;
  onclick?: () => void;
}

export default function ScrollableList({
  stockRepo,
  onRemove,
  onSelect,
  onclick,
}: Properties) {
  const [editingStockIndex, setEditingStockIndex] = useState<number | null>(
    null,
  );
  const [editedAmount, setEditedAmount] = useState<string>("");

  const handleEditClick = (
    index: number,
    amount: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent the stock from being selected when clicking edit
    setEditingStockIndex(index);
    setEditedAmount(amount.toString());
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditedAmount(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, stock: Stock) => {
    if (e.key === "Enter") {
      const newAmount = parseFloat(editedAmount);
      if (!isNaN(newAmount) && newAmount >= 0) {
        // Create a new Stock object with the updated amount
        const updatedStock = new Stock(
          stock.name,
          stock.price,
          newAmount,
          stock.change,
          stock.image_src,
          stock.marketCap,
          stock.dividendAmount,
          stock.industry,
          stock.headquarters,
          stock.peRatio,
        );

        // Replace the old stock with the updated one at the same index
        const stocks = [...stockRepo.getStocks()];
        const stockIndex = stocks.findIndex((s) => s.name === stock.name);

        if (stockIndex !== -1) {
          stocks[stockIndex] = updatedStock;
          // Update the stockRepo (assuming it has a method to update a stock)
          stock.updateAmount(newAmount);
          onSelect(stock); // Update the selected stock with new values
        }

        // Exit edit mode
        setEditingStockIndex(null);
      }
    } else if (e.key === "Escape") {
      // Cancel editing
      setEditingStockIndex(null);
    }
  };

  const handleStockClick = (stock: Stock) => {
    onSelect(stock);
  };

  // Sort stocks by price in descending order
  const sortedStocks = [...stockRepo.getStocks()].sort(
    (a, b) => b.price - a.price,
  );

  // Safely get the top 3 most expensive stocks
  const mostExpensiveStock = sortedStocks[0] || null;
  const secondMostExpensiveStock = sortedStocks[1] || null;
  const thirdMostExpensiveStock = sortedStocks[2] || null;

  return (
    <div className="h-full w-full flex flex-row items-start p-4 overflow-hidden pt-0">
      <div className="w-full max-w-3xl p-4">
        <div className="h-[calc(100vh-340px)] flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hidden">
          {[...stockRepo.getStocks()].map((s, index: number) => (
            <div
              key={index}
              onClick={() => {
                handleStockClick(s);
                if (onclick) {
                  onclick();
                }
              }}
              className={`bg-white p-4 rounded-lg flex justify-between items-center border-2 border-transparent transition-colors duration-300 ease-in-out cursor-pointer hover:border-blue-500
                                ${
                                  mostExpensiveStock &&
                                  s.price === mostExpensiveStock.price
                                    ? "hover:bg-amber-200" // Gold
                                    : secondMostExpensiveStock &&
                                        s.price ===
                                          secondMostExpensiveStock.price
                                      ? "hover:bg-slate-200" // Silver
                                      : thirdMostExpensiveStock &&
                                          s.price ===
                                            thirdMostExpensiveStock.price
                                        ? "hover:bg-orange-200" // Bronze
                                        : ""
                                }`}
            >
              <div className="flex flex-row justify-start items-center gap-6 font-semibold text-xl">
                <CompanyIcon />
                <span>{s.name}</span>
                <span className="flex items-center flex-row">
                  <PriceIcon />
                  {s.price}$
                </span>
                <span
                  className={`${s.change > 0 ? "text-green-600" : "text-red-500"} flex flex-row items-center`}
                >
                  {s.change > 0 ? <GreenArrowIcon /> : <RedArrowIcon />}
                  {s.change}%
                </span>
                <span className="flex items-center flex-row">
                  <WalletIcon />
                  {editingStockIndex === index ? (
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      value={editedAmount}
                      onChange={handleAmountChange}
                      onKeyDown={(e) => handleKeyDown(e, s)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    `${s.amount_owned}$`
                  )}
                </span>
              </div>
              <div className="flex justify-end items-center gap-4">
                <a
                  target="_blank"
                  href={"https://businessinsider.com/" + s.name.toLowerCase()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NewsIcon />
                </a>
                <a onClick={(e) => handleEditClick(index, s.amount_owned, e)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={editingStockIndex === index ? "#22c55e" : "#000000"}
                    className="bi bi-pencil cursor-pointer edit-icon transition-colors duration-300 ease-in-out"
                    width="30"
                    height="30"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z"
                    />
                  </svg>
                </a>
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(s);
                  }}
                >
                  <TrashIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
