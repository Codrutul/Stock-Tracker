import {useState} from "react";
import "./globals.css";
import Button_new from "./components/Button_new.tsx";
import Dark_mode_icon from "./components/Dark_mode_icon.tsx";
import SearchBar from "./components/SearchBar.tsx"
import EditableHeader from "./components/EditableHeader.tsx";
import DropDown from "./components/DropDown.tsx";
import ScrollableList from "./components/ScrollableList.tsx";
import StockRepo from "./classes/StockRepo.ts";
import Stock from "./classes/Stock.ts";

interface Option {
    value: string;
}


const optionsSort: Option[] = [
    {value: "Stock Price"},
    {value: "Company Market Cap"},
    {value: "Growth in the last month"},
    {value: "Dividend amount"},
    {value: "Amount owned"},
    {value: "Growth in the last month"},
];

const optionsFilter: Option[] = [
    {value: "All"},
    {value: "Technology"},
    {value: "Healthcare"},
    {value: "Finance"},
    {value: "Energy"},
    {value: "Agriculture"},
    {value: "Manufacturing"},
];


//const stock_2 = new Stock("Google", 2000, 20, 5, "src/assets/google.png");
//Stock_list.push(stock_1);
//Stock_list.push(stock_2);


function App() {

    const [stockList, setStockList] = useState<StockRepo>(new StockRepo([
        new Stock("Apple", 1000, 10, -5, "src/assets/apple.png"),
    ]));

    const [darkMode, setDarkMode] = useState(false)

    const [searchValue, setSearchValue] = useState<string>('');

    const handleSearchChange = (newText: string) => {
        setSearchValue(newText);
    };

    const handleAddStock = () => {
        const stock = new Stock(searchValue);
        setStockList((prevRepo) => {
            return prevRepo.addStock(stock);
        })
    };

    const handleRemoveStock = (stock: Stock) => {
        setStockList((prevRepo) => prevRepo.removeStock(stock));
    };


    return <div style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: darkMode ? "#102A43" : "#bce4f8",
        transition: "background-color 0.5s ease-in-out"
    }} className="overflow-hidden">

        <div className="flex flex-row items-start justify-start p-4 gap-2">

            <Dark_mode_icon image_src="src/assets/light_mode.png" image_src_hover="src/assets/light_mode_full.png"
                            desc="light mode" onClick={() => setDarkMode(false)}/>
            <Dark_mode_icon image_src="src/assets/dark_mode.png" image_src_hover="src/assets/dark_mode_full.png"
                            desc="dark mode" onClick={() => setDarkMode(true)}></Dark_mode_icon>
            <Button_new name="Notifications" darkMode={darkMode}
                        onClick={() => {
                        }}/>
            <Button_new name="Alerts" darkMode={darkMode} onClick={() => {
            }}/>
            <Button_new name="Suggestions" darkMode={darkMode} onClick={() => {
            }}/>

        </div>

        <div className="flex flex-row justify-end pr-4 gap-2">

            <SearchBar darkMode={darkMode} value={searchValue} onChange={handleSearchChange}
                       onEnter={handleAddStock}></SearchBar>
            <Button_new name="Add" darkMode={darkMode} onClick={handleAddStock}></Button_new>
        </div>


        <div className="flex flex-col items-start justify-start ">
            <div className="flex flex-col items-start justify-start p-8 gap-2 pt-0 pb-0">
                <EditableHeader initial_text="My Portfolio"/>
                <DropDown functionality="Sort by:" options={optionsSort}/>
                <div className="flex flex-row">
                    <DropDown functionality="Filter by:" options={optionsFilter}/>
                </div>
            </div>

            <ScrollableList stockRepo={stockList} onRemove={handleRemoveStock}/>
        </div>


    </div>
}

export default App;