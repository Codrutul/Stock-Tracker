import TrashIcon from "./TrashIcon.tsx";
import NewsIcon from "./NewsIcon.tsx";
import PriceIcon from "./PriceIcon.tsx";
import WalletIcon from "./WalletIcon.tsx";
import RedArrowIcon from "./RedArrowIcon.tsx";
import GreenArrowIcon from "./GreenArrowIcon.tsx";
import StockRepo from "../classes/StockRepo.ts";
import Stock from "../classes/Stock.ts";
import { ChangeEvent, KeyboardEvent, useState, useEffect, useRef, useCallback } from "react";
import CompanyIcon from "./CompanyIcon.tsx";
import { stockApi } from "../utils/api.ts";

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
  
  // States for infinite scrolling
  const [displayedStocks, setDisplayedStocks] = useState<Stock[]>([]);
  const itemsPerPage = 10; // Fixed number of items to load per batch
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastStockElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreStocks();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  
  // Load initial stocks
  useEffect(() => {
    setDisplayedStocks([]);
    setPage(1);
    setHasMore(true);
    loadInitialStocks();
  }, [stockRepo]); // Re-initialize when stockRepo changes
  
  const loadInitialStocks = () => {
    const stocks = stockRepo.getStocks();
    const initialStocks = stocks.slice(0, itemsPerPage);
    setDisplayedStocks(initialStocks);
    setHasMore(initialStocks.length < stocks.length);
  };
  
  const loadMoreStocks = () => {
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const stocks = stockRepo.getStocks();
      const nextPage = page + 1;
      const startIdx = (nextPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      
      const nextBatch = stocks.slice(startIdx, endIdx);
      
      if (nextBatch.length > 0) {
        setDisplayedStocks(prev => [...prev, ...nextBatch]);
        setPage(nextPage);
      }
      
      setHasMore(endIdx < stocks.length);
      setLoading(false);
    }, 500); // Simulate network delay
  };

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

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>, stock: Stock) => {
    if (e.key === "Enter") {
      const newAmount = parseFloat(editedAmount);
      if (!isNaN(newAmount) && newAmount >= 0) {
        try {
          // Show loading indicator or disable input
          setEditingStockIndex(null); // Exit edit mode immediately to prevent double submission

          console.log(`📝 Updating amount for ${stock.name} to ${newAmount}`);
          
          // Call API to update the amount in the backend
          const updatedStock = await stockApi.updateStockAmount(stock.name, newAmount);
          console.log(`✅ Amount updated successfully for ${stock.name}`, updatedStock);
          
          // Update the local stock
          stock.updateAmount(newAmount);
          
          // Update UI by notifying parent components
          onSelect(stock); // Update the selected stock if this was the selected one
        } catch (error) {
          console.error(`❌ Error updating amount for ${stock.name}:`, error);
          // Revert to edit mode on error or show an error message
          setEditingStockIndex(null);
          
          // TODO: Add proper error handling, maybe show a notification
          alert(`Failed to update amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Invalid amount, stay in edit mode
        alert("Please enter a valid amount (non-negative number)");
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

  const mostExpensiveStock = sortedStocks[0] || null;
  const secondMostExpensiveStock = sortedStocks[1] || null;
  const thirdMostExpensiveStock = sortedStocks[2] || null;

  return (
    <div className="h-full w-full flex flex-col items-start p-4 overflow-hidden pt-0">
      <div className="w-full max-w-3xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Stocks</h2>
          <div className="text-sm text-gray-600">
            {displayedStocks.length} of {stockRepo.getStocks().length} stocks loaded
          </div>
        </div>

        <div className="h-[calc(100vh-400px)] flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hidden">
          {displayedStocks.map((s, index: number) => {
            const isLastElement = index === displayedStocks.length - 1;
            
            return (
              <div
                key={index}
                ref={isLastElement ? lastStockElementRef : null}
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
                  <a
                    onClick={(e) =>
                      handleEditClick(index, s.amount_owned, e)
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={
                        editingStockIndex === index
                          ? "#22c55e"
                          : "#000000"
                      }
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
            );
          })}
          
          {loading && (
            <div className="flex justify-center p-4">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
            </div>
          )}
          
          {!hasMore && displayedStocks.length > 0 && (
            <div className="text-center p-2 text-gray-500">
              No more stocks to load
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
