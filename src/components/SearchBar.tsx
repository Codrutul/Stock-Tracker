interface Props {
    darkMode?: boolean;
    value: string
    onChange: (newText: string) => void;
    onEnter: (newText: string) => void;

}

function SearchBar({darkMode = false, value, onChange, onEnter}: Props) {

    return <>
        <div className="grid grid-cols-1 ">
            <div className="sm:col-span-4">

                <div
                    className={`flex items-center rounded-lg ${darkMode ? "bg-gray-500" : "bg-white"} pl-3 outline outline-1 -outline-offset-1
                outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2
                focus-within:outline-indigo-600`}
                    style={{width: "360px", height: "40px", transition: "background-color 0.5s ease-in-out"}}>
                    <input type="text" name="username" id="username" value={value}
                           onKeyDown={e => e.key === "Enter" && onEnter(e.currentTarget.value)}
                           onChange={e => onChange(e.target.value)}
                           className={`block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 ${darkMode ? "placeholder:text-gray-50" : "placeholder:text-gray-400"} focus:outline focus:outline-0 sm:text-sm/6`}
                           placeholder="Search for a stock"/>
                    <img src="src/assets/magnifying_glass.png" alt="magnifying glass"
                         style={{width: "24px", height: "24px", marginRight: "5px"}}></img>
                </div>

            </div>
        </div>
    </>
}

export default SearchBar;