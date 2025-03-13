import TrashIcon from "./TrashIcon.tsx";
import EditIcon from "./EditIcon.tsx";
import NewsIcon from "./NewsIcon.tsx";
import PriceIcon from "./PriceIcon.tsx";
import WalletIcon from "./WalletIcon.tsx";
import RedArrowIcon from "./RedArrowIcon.tsx";
import GreenArrowIcon from "./GreenArrowIcon.tsx";
import StockRepo from "../classes/StockRepo.ts";
import Stock from "../classes/Stock.ts";

interface Properties {
    stockRepo: StockRepo
    darkMode?: boolean
    onRemove: (stock: Stock) => void


}

export default function ScrollableList({stockRepo, onRemove}: Properties) {


    return (
        <div
            className="h-full w-full flex flex-row items-start p-4 overflow-hidden pt-0"
        >
            <div className="w-full max-w-3xl p-4">
                <div className="h-[calc(100vh-340px)] flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hidden">
                    {[...stockRepo.getStocks()].map((s, index: number) => (
                        <div
                            key={index}
                            onClick={() => {
                            }}
                            className="bg-white p-4 rounded-lg flex justify-between items-center border-2 border-transparent hover:border-blue-500 transition-colors duration-300 ease-in-out">
                            <div className="flex flex-row justify-start items-center gap-6 font-semibold text-xl">

                                <img width="53"
                                     src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCvh-j7HsTHJ8ZckknAoiZMx9VcFmsFkv72g&s"
                                     alt="Compnay Logo"></img>
                                <span>{s.name} </span>
                                <span className="flex items-center flex-row">
                                    <PriceIcon></PriceIcon>
                                    {s.price}$</span>
                                <span
                                    className={`${s.change > 0 ? "text-green-600" : "text-red-500"} flex flex-row items-center`}>{s.change > 0 ?
                                    <GreenArrowIcon/> : <RedArrowIcon/>}{s.change}%</span>
                                <span className="flex items-center flex-row">
                                    <WalletIcon></WalletIcon>
                                    {s.amount_owned}$</span>

                            </div>
                            <div className="flex justify-end items-center gap-4">
                                <a> <NewsIcon/> </a>
                                <a> <EditIcon/> </a>
                                <a onClick={() => onRemove(s)}> <TrashIcon/> </a>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="fit-content w-full p-4 flex flex-col  ">
                <span className="text-5xl">Company name</span>
                // continue from here
                // the company name should be more up and be dispayed when you press on a item from the list


            </div>

        </div>
    );
}
