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

// Add CSS for the flash animation
const flashAnimationStyle = `
@keyframes priceFlash {
  0% { background-color: rgba(97, 218, 251, 0.7); }
  100% { background-color: transparent; }
}

.price-updated {
  animation: priceFlash 2s ease-out;
}
`;

// Animation to highlight updated stocks
const animationStyle = `
@keyframes flash {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(59, 130, 246, 0.5); }
}

.stock-updated {
  animation: flash 1s ease-in-out 3;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.price-pulse {
  animation: pulse 0.5s ease-in-out 3;
  font-weight: bold;
}
`;

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
  
  // Map to track which stocks were recently updated
  const [updatedStocks, setUpdatedStocks] = useState<{[key: string]: boolean}>({});
  
  // Create a unique key for the current data state to help with re-rendering
  const [dataVersion, setDataVersion] = useState(0);
  
  // Get current timestamp to use as a cache-busting key for price/change updates
  const stockPriceUpdateKey = useRef(Date.now());
  
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
    console.log('🔄 ScrollableList: stockRepo changed, reloading stocks');
    console.log(`📊 ScrollableList: StockRepo now has ${stockRepo.getStocks().length} stocks`);
    
    // Immediately update displayed stocks with latest data
    const stocks = stockRepo.getStocks();
    const initialStocks = stocks.slice(0, Math.max(itemsPerPage, displayedStocks.length));
    
    console.log(`🔄 ScrollableList: Updating displayed stocks (${initialStocks.length} items)`);
    
    // Reset pagination if needed
    if (displayedStocks.length === 0) {
      setPage(1);
    }
    
    // Update displayed stocks with new data
    setDisplayedStocks(initialStocks);
    setHasMore(initialStocks.length < stocks.length);
    
    // Force a re-render of the entire list
    setDataVersion(prev => prev + 1);
    stockPriceUpdateKey.current = Date.now();
    
    // Log the first few stocks for debugging
    if (initialStocks.length > 0) {
      console.log('📊 ScrollableList: First few stocks:');
      initialStocks.slice(0, 3).forEach(stock => {
        console.log(`   - ${stock.name}: Price=${stock.price}, Change=${stock.change}%`);
      });
    }
  }, [stockRepo]); // Re-initialize when stockRepo changes
  
  // Effect to listen for price updates in the repo and update UI
  useEffect(() => {
    console.log('🔄 ScrollableList: Setting up stock update detector');
    
    // When displayed stocks change, check for updates
    const currentStocks = stockRepo.getStocks();
    if (displayedStocks.length === 0 || currentStocks.length === 0) return;
    
    const newUpdates: {[key: string]: boolean} = {};
    let hasUpdates = false;
    
    // Compare displayed stocks with latest repo data
    displayedStocks.forEach(displayedStock => {
      const currentStock = currentStocks.find(s => s.name === displayedStock.name);
      if (currentStock && (
          currentStock.price !== displayedStock.price || 
          currentStock.change !== displayedStock.change
      )) {
        console.log(`📊 ScrollableList: Detected update for ${displayedStock.name}: Price ${displayedStock.price} → ${currentStock.price}, Change ${displayedStock.change}% → ${currentStock.change}%`);
        newUpdates[displayedStock.name] = true;
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      console.log('🔄 ScrollableList: Highlighting updated stocks');
      setUpdatedStocks(newUpdates);
      
      // Clear the highlight after animation completes
      const timerId = setTimeout(() => {
        setUpdatedStocks({});
      }, 3000);
      
      return () => clearTimeout(timerId);
    }
  }, [displayedStocks, stockRepo]);
  
  // Simple cache update on interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      stockPriceUpdateKey.current = Date.now();
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
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
          
          // Force re-render of the list
          setDataVersion(prev => prev + 1);
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
      {/* Add style element for animation */}
      <style dangerouslySetInnerHTML={{ __html: flashAnimationStyle }} />
      <style dangerouslySetInnerHTML={{ __html: animationStyle }} />
      
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
                key={`${s.name}-${s.price}-${s.change}-${dataVersion}`}
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
                                  }
                                  ${updatedStocks[s.name] ? "price-updated" : ""}
                                  ${updatedStocks[s.name] ? "stock-updated" : ""}
                                  `}
              >
                <div className="flex flex-row justify-start items-center gap-6 font-semibold text-xl">
                  <CompanyIcon />
                  <span>{s.name}</span>
                  <span 
                    className={`flex items-center flex-row ${updatedStocks[s.name] ? 'price-pulse' : ''}`} 
                    key={`price-${s.name}-${s.price}-${dataVersion}`}
                  >
                    <PriceIcon />
                    {s.price}$
                  </span>
                  <span
                    className={`${s.change > 0 ? "text-green-600" : "text-red-500"} flex flex-row items-center ${updatedStocks[s.name] ? 'price-pulse' : ''}`}
                    key={`change-${s.name}-${s.change}-${dataVersion}`}
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
                        d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(s);
                    }}
                  >
                    <TrashIcon></TrashIcon>
                  </a>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
