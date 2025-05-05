import { useEffect, useState, useRef } from "react";
import Button_new from "./components/Button_new.tsx";
import Dark_mode_icon from "./components/Dark_mode_icon.tsx";
import SearchBar from "./components/SearchBar.tsx";
import EditableHeader from "./components/EditableHeader.tsx";
import DropDown from "./components/DropDown.tsx";
import ScrollableList from "./components/ScrollableList.tsx";
import StockRepo from "./classes/StockRepo.ts";
import Stock from "./classes/Stock.ts";
import CompanyHeadline from "./components/CompanyHeadline.tsx";
import Notification from "./components/Notification.tsx";
import Modal from "./components/Modal.tsx";
import AdvancedSearch from "./components/AdvancedSearch.tsx";
import ChartIcon from "./components/ChartIcon.tsx";
import ChartLineIcon from "./components/CharLineIcon.tsx";
import PortfolioPieChart from "./components/PortfolioPieChart.tsx";
import DonutChartIcon from "./components/DonutChartIcon.tsx";
import IndustryDonutChart from "./components/IndustryDonutChart.tsx";
import BarChartIcon from "./components/BarChartIcon.tsx";
import StockBarChart from "./components/StockBarChart.tsx";
import { StockGenerator } from "./utils/StockGenerator.ts";
import { stockApi } from "./utils/api.ts";
import FileManager from "./pages/FileManager.tsx";
import { websocketService, WebSocketEvent } from "./utils/websocket.ts";

interface Option {
  value: string;
}

const optionsSort: Option[] = [
  { value: "Stock Price" },
  { value: "Company Market Cap" },
  { value: "Growth in the last month" },
  { value: "Dividend amount" },
  { value: "Amount owned" },
];

const optionsFilter: Option[] = [
  { value: "All" },
  { value: "Technology" },
  { value: "Healthcare" },
  { value: "Finance" },
  { value: "Energy" },
  { value: "Agriculture" },
  { value: "Manufacturing" },
  { value: "Consumer Cyclical" },
  { value: "Entertainment" },
  { value: "Automotive" },
];

function App() {
  const [stockList, setStockList] = useState<StockRepo>(
    new StockRepo([
      new Stock(
        "Apple",
        193,
        10,
        -5,
        "src/assets/apple.png",
        2930000000000,
        0.96,
        "Technology",
        "Cupertino, CA",
        30.12,
      ),
      new Stock(
        "Tesla",
        177,
        20,
        -20,
        "src/assets/tesla.png",
        565000000000,
        0,
        "Automotive",
        "Austin, TX",
        62.18,
      ),
    ]),
  );

  const [darkMode, setDarkMode] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [filterValue, setFilterValue] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("Stock Price");
  const [notification, setNotification] = useState({
    message: "",
    isVisible: false,
    type: "error" as "error" | "success" | "info",
  });
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999999999999 });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'portfolio' | 'fileManager'>('portfolio');
  const [isRealTimeUpdatesEnabled, setIsRealTimeUpdatesEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [showUpdateBadge, setShowUpdateBadge] = useState(false);
  const websocketInitialized = useRef(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(navigator.onLine);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);

  // Effect to fetch all stocks on initial load
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        console.log('🔄 App: Fetching all stocks from backend...');
        setIsLoading(true);
        const stocks = await stockApi.getAllStocks();
        setStockList(new StockRepo(stocks));
        console.log(`✅ App: Successfully loaded ${stocks.length} stocks`);
        showNotification("Stocks loaded successfully", "success");
      } catch (error) {
        console.error("❌ App: Error fetching stocks:", error);
        showNotification("Failed to load stocks from server", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, []);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (websocketInitialized.current) return;
    
    // Mark as initialized to prevent multiple connections
    websocketInitialized.current = true;
    
    // Define WebSocket event handler
    const handleWebSocketEvent = (event: WebSocketEvent) => {
      if (!isRealTimeUpdatesEnabled) return;
      
      console.log(`📊 WebSocket event received: ${event.type}`);
      
      if (event.type === 'connect') {
        showNotification("Real-time updates connected", "success");
      } 
      else if (event.type === 'disconnect') {
        showNotification("Real-time updates disconnected", "info");
      } 
      else if (event.type === 'error') {
        showNotification("Real-time update error", "error");
      } 
      else if (event.type === 'stocks') {
        // Handle stock updates
        const updatedStocks = event.payload as Stock[];
        
        if (updatedStocks && updatedStocks.length > 0) {
          console.log(`📈 App: Received updates for ${updatedStocks.length} stocks via WebSocket`);
          // Set the last update time
          setLastUpdateTime(new Date());
          
          // Get the current stocks
          const currentStocks = stockList.getStocks().slice();
          
          // Map for faster lookups
          const stockMap = new Map();
          currentStocks.forEach(stock => stockMap.set(stock.name, stock));
          
          // Track which stocks were updated
          let changesFound = false;
          
          // Update stocks directly
          updatedStocks.forEach(updatedStock => {
            const existingStock = stockMap.get(updatedStock.name);
            if (existingStock) {
              if (existingStock.price !== updatedStock.price || existingStock.change !== updatedStock.change) {
                changesFound = true;
                console.log(`✏️ App: Updating ${updatedStock.name}: Price ${existingStock.price} → ${updatedStock.price}, Change ${existingStock.change}% → ${updatedStock.change}%`);
                
                // Replace with updated stock
                stockMap.set(updatedStock.name, updatedStock);
              }
            }
          });
          
          if (changesFound) {
            // Create a new array with updated stocks
            const updatedStockArray = Array.from(stockMap.values());
            
            // Create and set a brand new StockRepo instance
            console.log(`🔄 App: Creating new StockRepo with ${updatedStockArray.length} stocks`);
            const newRepo = new StockRepo(updatedStockArray);
            setStockList(newRepo);
            
            // Update selected stock if needed
            if (selectedStock) {
              const updatedSelectedStock = updatedStocks.find(s => s.name === selectedStock.name);
              if (updatedSelectedStock) {
                console.log(`🔄 App: Updating selected stock ${selectedStock.name}`);
                setSelectedStock(updatedSelectedStock);
              }
            }
            
            // Show update badge for 5 seconds
            setShowUpdateBadge(true);
            setTimeout(() => setShowUpdateBadge(false), 5000);
            
            showNotification("Stock prices updated", "info");
          } else {
            console.log('ℹ️ App: No price changes detected in WebSocket update');
          }
        }
      }
      else if (event.type === 'init') {
        // Handle initial data load from WebSocket
        const stocks = event.payload as Stock[];
        
        if (stocks && stocks.length > 0) {
          console.log(`📈 Received initial data for ${stocks.length} stocks from WebSocket`);
          const newStockRepo = new StockRepo(stocks);
          setStockList(newStockRepo);
          
          // If we don't have a selected stock yet, select the first one
          if (!selectedStock && stocks.length > 0) {
            setSelectedStock(stocks[0]);
          } else if (selectedStock) {
            // If we have a selected stock, find it in the new data
            const selectedStockInNewData = stocks.find(s => s.name === selectedStock.name);
            if (selectedStockInNewData) {
              setSelectedStock(selectedStockInNewData);
            } else if (stocks.length > 0) {
              // If selected stock doesn't exist in new data, select the first stock
              setSelectedStock(stocks[0]);
            }
          }
        }
      }
    };
    
    // Add WebSocket event listener
    websocketService.addEventListener(handleWebSocketEvent);
    
    // Connect to WebSocket server
    console.log('🔌 Establishing WebSocket connection...');
    websocketService.connect();
    
    // Cleanup on component unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      websocketService.removeEventListener(handleWebSocketEvent);
      websocketService.disconnect();
    };
  }, [isRealTimeUpdatesEnabled, selectedStock, stockList]);
  
  // Effect to fetch filtered and sorted stocks when filter or sort options change
  useEffect(() => {
    const fetchFilteredAndSortedStocks = async () => {
      try {
        console.log(`🔄 App: Fetching filtered and sorted stocks...`);
        console.log(`   Filter: ${filterValue}, Price Range: ${priceRange.min}-${priceRange.max}, Sort: ${sortOption}`);
        setIsLoading(true);
        const stocks = await stockApi.getFilteredAndSortedStocks(
          filterValue,
          priceRange.min,
          priceRange.max,
          sortOption
        );
        
        // Update stock list with filtered and sorted data from backend
        const updatedRepo = new StockRepo(stocks);
        setStockList(updatedRepo);
        console.log(`✅ App: Successfully loaded ${stocks.length} filtered/sorted stocks`);
        
        // Update selected stock if needed
        if (stocks.length > 0) {
          // If current selected stock is not in the filtered list, select the first one
          if (!selectedStock || !stocks.some(s => s.name === selectedStock.name)) {
            setSelectedStock(stocks[0]);
            console.log(`🔄 App: Updated selected stock to ${stocks[0].name}`);
          }
        } else if (selectedStock) {
          // If no stocks in filtered list but we have a selected stock, clear it
          setSelectedStock(null);
          console.log('🔄 App: Cleared selected stock');
        }
      } catch (error) {
        console.error("❌ App: Error fetching filtered and sorted stocks:", error);
        showNotification("Failed to apply filters and sorting", "error");
      } finally {
        setIsLoading(false);
      }
    };

    // Don't fetch on initial render (the first useEffect will handle that)
    if (filterValue || sortOption || priceRange.min > 0 || priceRange.max < 1000) {
      fetchFilteredAndSortedStocks();
    }
  }, [filterValue, sortOption, priceRange.min, priceRange.max]);

  const handleSearchChange = (newText: string) => {
    setSearchValue(newText);
  };

  const showNotification = (
    message: string,
    type: "error" | "success" | "info" = "error",
  ) => {
    setNotification({
      message,
      isVisible: true,
      type,
    });
  };

  const hideNotification = () => {
    setNotification((prev: { message: string; isVisible: boolean; type: "error" | "success" | "info"; }) => ({
      ...prev,
      isVisible: false,
    }));
  };

  const handleAddStock = async () => {
    if (!searchValue.trim()) {
      showNotification("Please enter a stock name", "info");
      return;
    }

    try {
      console.log(`🔄 App: Adding stock "${searchValue}"...`);
      setIsLoading(true);
      
      // Normalize search value (trim whitespace)
      const stockName = searchValue.trim();
      
      // Check if the stock is already in the portfolio (case insensitive check)
      const stockExists = stockList
        .getStocks()
        .some(
          (stock: Stock) => stock.name.toLowerCase() === stockName.toLowerCase(),
        );

      if (stockExists) {
        console.log(`⚠️ App: Stock "${stockName}" already exists in portfolio`);
        showNotification(
          `${stockName} is already in your portfolio`,
          "error",
        );
        setIsLoading(false);
        return;
      }
      
      // Send only the name to the backend, which will generate all other attributes
      console.log(`🔄 App: Creating stock with name: ${stockName}`);
      const addedStock = await stockApi.createStock(new Stock(stockName));
      
      console.log(`✅ App: Successfully added stock: ${addedStock.name}`);
      
      // Update local state
      setStockList((prevRepo: StockRepo) => {
        return prevRepo.addStock(addedStock);
      });
      setSelectedStock(addedStock);

      // Show success notification
      showNotification(`Added ${stockName} to your portfolio`, "success");
      
      // Clear the search bar
      setSearchValue("");
    } catch (error) {
      console.error("❌ App: Error adding stock:", error);
      showNotification(`Error adding ${searchValue}: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStock = async (stock: Stock) => {
    try {
      console.log(`🔄 App: Removing stock "${stock.name}"...`);
      setIsLoading(true);
      // Remove from database via API
      await stockApi.deleteStock(stock.name);
      console.log(`✅ App: Successfully removed stock: ${stock.name}`);
      
      // Update local state
      setStockList((prevRepo: StockRepo) => prevRepo.removeStock(stock));
      if (selectedStock && selectedStock.name === stock.name) {
        if (stockList.getStocks().length > 0) {
          setSelectedStock(stockList.getStocks()[0]);
          console.log(`🔄 App: Updated selected stock to ${stockList.getStocks()[0].name}`);
        } else {
          setSelectedStock(null);
          console.log('🔄 App: Cleared selected stock');
        }
      }

      // Show notification when a stock is removed
      showNotification(`Removed ${stock.name} from your portfolio`, "info");
    } catch (error) {
      console.error("❌ App: Error removing stock:", error);
      showNotification(`Error removing ${stock.name}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleFilterChange = (filterOption: string) => {
    setFilterValue(filterOption);
  };

  const handleSortChange = (sortOption: string) => {
    setSortOption(sortOption);
  };

  const handleAdvancedSearchApply = (minPrice: number, maxPrice: number) => {
    setPriceRange({ min: minPrice, max: maxPrice });
  };

  // This function just passes the already filtered and sorted stockList 
  // which will be loaded incrementally by the ScrollableList using infinite scrolling
  const getFilteredAndSortedStocks = () => {
    return stockList; // The stockList is already filtered and sorted from the backend
  };

  const [isChartOn, setIsChartOn] = useState(true);
  const [isPieChartOn, setIsPieChartOn] = useState(false);
  const [isDonutChartOn, setIsDonutChartOn] = useState(false);
  const [isBarChartOn, setIsBarChartOn] = useState(false);

  const handleGenerateData = async () => {
    // Show loading notification
    showNotification("Generating stocks...", "info");
    setIsLoading(true);

    try {
      // Generate stocks locally first
      const generatedStocks = StockGenerator.generateRandomStocks(10); // Generate fewer stocks for API
      const updatedRepo = new StockRepo([...stockList.getStocks()]);
      
      // Add each stock to the database via API
      for (const stock of generatedStocks) {
        try {
          const addedStock = await stockApi.createStock(stock);
          updatedRepo.appendStock(addedStock);
        } catch (err) {
          console.error(`Error adding stock ${stock.name}:`, err);
          // Continue with the next stock
        }
      }
      
      // Update local state
      setStockList(updatedRepo);

      // Show success notification
      showNotification(
        `Successfully added new stocks to your portfolio`,
        "success"
      );
    } catch (err) {
      // Show error notification if something goes wrong
      console.error("Failed to generate stocks:", err);
      showNotification(
        "Failed to generate stocks. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRealTimeUpdates = () => {
    const newState = !isRealTimeUpdatesEnabled;
    setIsRealTimeUpdatesEnabled(newState);
    
    if (newState) {
      websocketService.connect();
      showNotification("Real-time updates enabled", "success");
    } else {
      showNotification("Real-time updates disabled", "info");
    }
  };

  // Effect to track network status
  useEffect(() => {
    const updateOnlineStatus = () => setIsNetworkOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Effect to periodically check server status (every 10s)
  useEffect(() => {
    const checkServer = async () => {
      if (isNetworkOnline) {
        const ok = await stockApi.pingServer();
        setIsServerOnline(ok);
      } else {
        setIsServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, [isNetworkOnline]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: darkMode ? "#102A43" : "#bce4f8",
        transition: "background-color 0.5s ease-in-out",
      }}
      className="overflow-hidden"
    >
      {/* Animation style for updates */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
      
      {/* Network/server status banners */}
      {!isNetworkOnline && (
        <div style={{ background: '#f87171', color: 'white', padding: '8px', textAlign: 'center', fontWeight: 'bold', letterSpacing: 1 }}>
          <span role="img" aria-label="wifi-off">📡</span> You are offline (network down)
        </div>
      )}
      {isNetworkOnline && !isServerOnline && (
        <div style={{ background: '#fbbf24', color: 'black', padding: '8px', textAlign: 'center', fontWeight: 'bold', letterSpacing: 1 }}>
          <span role="img" aria-label="server-down">🖥️</span> Server is unreachable (server down)
        </div>
      )}

      {/* Notification component */}
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
      />

      <div className="flex flex-row items-between justify-between p-4">
        <div className="flex flex-row items-start justify-start gap-2">
          <Dark_mode_icon
            image_src="src/assets/light_mode.png"
            image_src_hover="src/assets/light_mode_full.png"
            desc="light mode"
            onClick={() => setDarkMode(false)}
          />
          <Dark_mode_icon
            image_src="src/assets/dark_mode.png"
            image_src_hover="src/assets/dark_mode_full.png"
            desc="dark mode"
            onClick={() => setDarkMode(true)}
          ></Dark_mode_icon>
          <Button_new
            name="Notifications"
            darkMode={darkMode}
            onClick={() => {}}
          />
          <Button_new name="Alerts" darkMode={darkMode} onClick={() => {}} />
          <Button_new
            name="Suggestions"
            darkMode={darkMode}
            onClick={() => {}}
          />
          <Button_new 
            name={isLoading ? "Loading..." : "Generate Data"} 
            onClick={handleGenerateData}
            disabled={isLoading}
          />
          <Button_new
            name="File Manager"
            darkMode={darkMode}
            onClick={() => setCurrentPage('fileManager')}
          />
          <Button_new
            name="Portfolio"
            darkMode={darkMode}
            onClick={() => setCurrentPage('portfolio')}
          />
          <Button_new
            name={isRealTimeUpdatesEnabled ? "Disable Updates" : "Enable Updates"}
            darkMode={darkMode}
            onClick={toggleRealTimeUpdates}
          />
          {isRealTimeUpdatesEnabled && lastUpdateTime && (
            <div className={`flex items-center ${darkMode ? 'text-blue-300' : 'text-blue-700'} ml-2`}>
              <div className={`w-2 h-2 rounded-full ${lastUpdateTime && Date.now() - lastUpdateTime.getTime() < 5000 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} mr-2`}></div>
              <span className="text-xs">Last update: {lastUpdateTime.toLocaleTimeString()}</span>
              {showUpdateBadge && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  New updates
                </span>
              )}
            </div>
          )}
        </div>
        {currentPage === 'portfolio' && (
          <div className="flex flex-row justify-end pr-4 gap-2">
            <SearchBar
              darkMode={darkMode}
              value={searchValue}
              onChange={handleSearchChange}
              onEnter={handleAddStock}
            ></SearchBar>
            <Button_new
              name={isLoading ? "Loading..." : "Add"}
              darkMode={darkMode}
              onClick={handleAddStock}
              disabled={isLoading}
            ></Button_new>
          </div>
        )}
      </div>

      {currentPage === 'portfolio' ? (
        <div className="flex flex-col items-start justify-start">
          <div className="w-full px-8 relative">
            <div className="flex flex-col items-start justify-start py-4 gap-2">
              <EditableHeader initial_text="My Portfolio" />
              <DropDown
                functionality="Sort by:"
                options={optionsSort}
                onChange={handleSortChange}
              />
              <div className="flex flex-row items-center gap-3.5">
                <DropDown
                  functionality="Filter by:"
                  options={optionsFilter}
                  onChange={handleFilterChange}
                />
                <Button_new
                  name="Advanced Search"
                  onClick={() => setIsAdvancedSearchOpen(true)}
                />
                <div className="flex items-center gap-2 ml-1">
                  <ChartLineIcon
                    onClick={() => {
                      setIsChartOn(true);
                      setIsPieChartOn(false);
                      setIsDonutChartOn(false);
                      setIsBarChartOn(false);
                    }}
                  />
                  <ChartIcon
                    onClick={() => {
                      setIsChartOn(false);
                      setIsPieChartOn(true);
                      setIsDonutChartOn(false);
                      setIsBarChartOn(false);
                    }}
                  />
                  <DonutChartIcon
                    onClick={() => {
                      setIsChartOn(false);
                      setIsPieChartOn(false);
                      setIsDonutChartOn(true);
                      setIsBarChartOn(false);
                    }}
                  />
                  <BarChartIcon
                    onClick={() => {
                      setIsChartOn(false);
                      setIsPieChartOn(false);
                      setIsDonutChartOn(false);
                      setIsBarChartOn(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="absolute top-1.5 left-[750px]">
              {isChartOn ? (
                <CompanyHeadline selectedStock={selectedStock} />
              ) : null}
              {isPieChartOn ? <PortfolioPieChart stockRepo={stockList} /> : null}
              {isDonutChartOn ? (
                <IndustryDonutChart stockRepo={stockList} />
              ) : null}
              {isBarChartOn ? <StockBarChart stockRepo={stockList} /> : null}
            </div>
          </div>
          <ScrollableList
            stockRepo={getFilteredAndSortedStocks()}
            onRemove={handleRemoveStock}
            onSelect={handleSelectStock}
            onclick={() => {
              setIsChartOn(true);
              setIsPieChartOn(false);
              setIsDonutChartOn(false);
            }}
          />
        </div>
      ) : (
        <FileManager />
      )}

      <Modal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        title="Advanced Search"
      >
        <AdvancedSearch
          onApply={handleAdvancedSearchApply}
          onClose={() => setIsAdvancedSearchOpen(false)}
          currentMinPrice={priceRange.min}
          currentMaxPrice={priceRange.max}
        />
      </Modal>
    </div>
  );
}

export default App;
