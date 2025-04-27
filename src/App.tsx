import { useEffect, useState } from "react";
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
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'portfolio' | 'fileManager'>('portfolio');

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
