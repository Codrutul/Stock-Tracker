import Stock from "../classes/Stock.ts";
import Chart from "./Chart.tsx";
import SharesInput from "./SharesInput.tsx";
import ButtonGreen from "./ButtonGreen.tsx";
import ButtonRed from "./ButtonRed.tsx";
import Button_new from "./Button_new.tsx";
import { useEffect, useState, useRef } from 'react';

interface CompanyHeadlineProps {
  selectedStock?: Stock | null;
}

export default function CompanyHeadline({
  selectedStock,
}: CompanyHeadlineProps) {
  // Add a ref to track when the stock data changes to ensure re-renders
  const updateKey = useRef(Date.now());
  // Keep a local copy of the selected stock to detect changes
  const [stockSnapshot, setStockSnapshot] = useState<Stock | null | undefined>(selectedStock);
  
  // Update the update key when the selected stock changes
  useEffect(() => {
    if (selectedStock !== stockSnapshot) {
      updateKey.current = Date.now();
      setStockSnapshot(selectedStock);
    }
  }, [selectedStock, stockSnapshot]);
  
  // Also set up a small interval to check for price/change updates within the same stock
  useEffect(() => {
    if (!selectedStock) return;
    
    const intervalId = setInterval(() => {
      if (stockSnapshot && selectedStock) {
        // If price or change percentage has been updated, force a re-render
        if (stockSnapshot.price !== selectedStock.price || 
            stockSnapshot.change !== selectedStock.change) {
          console.log('🔄 CompanyHeadline: Detected stock price/change update, refreshing');
          updateKey.current = Date.now();
          // Create a proper copy of the stock for comparison
          setStockSnapshot(selectedStock);
        }
      }
    }, 500);
    
    return () => clearInterval(intervalId);
  }, [selectedStock, stockSnapshot]);

  // Format market cap in billions/trillions
  const formatMarketCap = (marketCap: number): string => {
    if (marketCap === undefined || marketCap === null) return "N/A";
    
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(2)}T$`;
    } else if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(2)}B$`;
    } else if (marketCap >= 1000000) {
      return `${(marketCap / 1000000).toFixed(2)}M$`;
    }
    return `${marketCap.toLocaleString()}$`;
  };

  // Simplified dividend formatter to match image
  const formatDividend = (dividend: number): string => {
    if (dividend === undefined || dividend === null) return "N/A";
    return dividend.toFixed(2).toString();
  };

  // Simplified PE ratio formatter
  const formatPERatio = (peRatio: number): string => {
    if (peRatio === undefined || peRatio === null) return "N/A";
    return peRatio.toFixed(2).toString();
  };

  return (
    <div className="flex flex-col items-start ml-7 mt-4 w-[450px]">
      {/* Stock information section */}
      <h1 className="text-5xl mb-2 w-full">
        {selectedStock ? selectedStock.name : "No company selected"}
      </h1>

      <div className="grid grid-cols-2 gap-y-3 gap-x-8 w-full text-sm mt-2.5">
        {/* Row 1 */}
        <div key={`market-cap-${updateKey.current}`}>
          <span className="font-normal">Market cap: </span>
          <span>
            {selectedStock ? formatMarketCap(selectedStock.marketCap) : ""}
          </span>
        </div>

        <div key={`dividend-${updateKey.current}`}>
          <span className="font-normal">Dividend yield: </span>
          <span>
            {selectedStock ? formatDividend(selectedStock.dividendAmount) : ""}
          </span>
        </div>

        {/* Row 2 */}
        <div>
          <span className="font-normal">Headquarters: </span>
          <span>{selectedStock ? selectedStock.headquarters : ""}</span>
        </div>

        <div key={`pe-ratio-${updateKey.current}`}>
          <span className="font-normal">P/E ratio: </span>
          <span>
            {selectedStock ? formatPERatio(selectedStock.peRatio) : ""}
          </span>
        </div>

        {/* Row 3 */}
        <div>
          <span className="font-normal">Industry: </span>
          <span>{selectedStock ? selectedStock.industry : ""}</span>
        </div>


      </div>

      <div className="flex flex-col mt-2">
        <Chart key={`chart-${updateKey.current}`} stockData={selectedStock} />
        <div className="flex flex-row justify-between mt-4">
          <SharesInput />
          <div className="flex flex-row gap-4">
            <ButtonGreen text="Buy" />
            <ButtonRed text="Sell" />
          </div>
        </div>
        <div className="flex flex-row justify-end mt-4">
          <Button_new name="Analyse Risk" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}
