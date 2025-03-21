import { useEffect, useState } from "react";
import "./globals.css";
import Button_new from "./components/Button_new.tsx";
import Dark_mode_icon from "./components/Dark_mode_icon.tsx";
import SearchBar from "./components/SearchBar.tsx";
import EditableHeader from "./components/EditableHeader.tsx";
import DropDown from "./components/DropDown.tsx";
import ScrollableList from "./components/ScrollableList.tsx";
import StockRepo, { stockDataBase } from "./classes/StockRepo.ts";
import Stock from "./classes/Stock.ts";
import CompanyHeadline from "./components/CompanyHeadline.tsx";
import Notification from "./components/Notification.tsx";
import Modal from "./components/Modal.tsx";
import AdvancedSearch from "./components/AdvancedSearch.tsx";
import ChartIcon from "./components/ChartIcon.tsx";
import ChartLineIcon from "./components/CharLineIcon.tsx";

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
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  const handleAddStock = () => {
    if (!searchValue.trim()) {
      showNotification("Please enter a stock name", "info");
      return;
    }

    if (stockDataBase.verifyStock(searchValue)) {
      // Check if the stock is already in the portfolio
      const stockExists = stockList
        .getStocks()
        .some(
          (stock) => stock.name.toLowerCase() === searchValue.toLowerCase(),
        );

      if (stockExists) {
        showNotification(
          `${searchValue} is already in your portfolio`,
          "error",
        );
        return;
      }

      const stockToAdd = stockDataBase.getStock(searchValue);
      setStockList((prevRepo) => {
        return prevRepo.addStock(stockToAdd);
      });
      setSelectedStock(stockToAdd || null);

      // Show success notification
      showNotification(`Added ${searchValue} to your portfolio`, "success");

      // Clear the search bar
      setSearchValue("");
    } else {
      showNotification(`Could not find stock: ${searchValue}`, "error");
    }
  };

  const handleRemoveStock = (stock: Stock) => {
    setStockList((prevRepo) => prevRepo.removeStock(stock));
    if (selectedStock && selectedStock.name === stock.name) {
      if (stockList.getStocks().length > 0) {
        setSelectedStock(stockList.getStocks()[0]);
      } else setSelectedStock(null);
    }

    // Show notification when a stock is removed
    showNotification(`Removed ${stock.name} from your portfolio`, "info");
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

  // Function to sort stocks based on selected option
  const sortStocks = (stocks: Stock[]): Stock[] => {
    const stocksCopy = [...stocks];

    switch (sortOption) {
      case "Stock Price":
        return stocksCopy.sort((a, b) => b.price - a.price);

      case "Company Market Cap":
        return stocksCopy.sort((a, b) => b.marketCap - a.marketCap);

      case "Growth in the last month":
        return stocksCopy.sort((a, b) => b.change - a.change);

      case "Dividend amount":
        return stocksCopy.sort((a, b) => b.dividendAmount - a.dividendAmount);

      case "Amount owned":
        return stocksCopy.sort((a, b) => b.amount_owned - a.amount_owned);

      default:
        return stocksCopy;
    }
  };

  // Filter and sort stocks
  const getFilteredAndSortedStocks = () => {
    let filteredStocks: Stock[];

    // First filter by industry
    if (filterValue === "All") {
      filteredStocks = stockList.getStocks();
    } else {
      filteredStocks = stockList.getStocksByIndustry(filterValue);
    }

    filteredStocks = new StockRepo(filteredStocks).getStocksPriceRange(
      priceRange["min"],
      priceRange["max"],
    );

    const sortedStocks = sortStocks(filteredStocks);
    return new StockRepo(sortedStocks);
  };

  // Effect to ensure a stock is selected when the component mounts
  // or when the stock list changes
  useEffect(() => {
    const filteredAndSortedStocks = getFilteredAndSortedStocks().getStocks();

    // If we have stocks but nothing is selected, select the first one
    if (filteredAndSortedStocks.length > 0 && !selectedStock) {
      setSelectedStock(filteredAndSortedStocks[0]);
    }
    // If we have no stocks, make sure nothing is selected
    else if (filteredAndSortedStocks.length === 0 && selectedStock) {
      setSelectedStock(null);
    }
    // If the currently selected stock is not in the filtered list anymore,
    // select the first one from the filtered list
    else if (
      filteredAndSortedStocks.length > 0 &&
      selectedStock &&
      !filteredAndSortedStocks.some(
        (stock) => stock.name === selectedStock.name,
      )
    ) {
      setSelectedStock(filteredAndSortedStocks[0]);
    }
  }, [stockList, filterValue, sortOption]);

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
        </div>

        <div className="flex flex-row justify-end pr-4 gap-2">
          <SearchBar
            darkMode={darkMode}
            value={searchValue}
            onChange={handleSearchChange}
            onEnter={handleAddStock}
          ></SearchBar>
          <Button_new
            name="Add"
            darkMode={darkMode}
            onClick={handleAddStock}
          ></Button_new>
        </div>
      </div>

      <div className="flex flex-col items-start justify-start">
        <div className="w-full px-8 relative">
          <div className="flex flex-col items-start justify-start py-4 gap-2">
            <EditableHeader initial_text="My Portfolio" />
            <DropDown
              functionality="Sort by:"
              options={optionsSort}
              onChange={handleSortChange}
            />
            <div className="flex flex-row justify-end gap-3.5">
              <DropDown
                functionality="Filter by:"
                options={optionsFilter}
                onChange={handleFilterChange}
              />
              <Button_new
                name="Advanced Search"
                onClick={() => setIsAdvancedSearchOpen(true)}
              />
              <ChartIcon />
              <ChartLineIcon></ChartLineIcon>
            </div>
          </div>

          <div className="absolute top-4 left-[757px]">
            <CompanyHeadline selectedStock={selectedStock} />
          </div>
        </div>
        <ScrollableList
          stockRepo={getFilteredAndSortedStocks()}
          onRemove={handleRemoveStock}
          onSelect={handleSelectStock}
        />
      </div>

      {/* Add the Modal component */}
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
