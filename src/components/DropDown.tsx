import {useState} from "react";

interface Option {
    value: string;
}

interface Props {
    darkMode?: boolean;
    functionality: string;
    options: Option[];
}


export default function DropdownWithDescription({functionality, options}: Props) {
    const [selected, setSelected] = useState<string>(options[0].value);

    return (
        <div className="flex items-center space-x-4">
            <span className="text-lg font-medium">{functionality}</span>
            <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="px-3 py-2 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.value}
                    </option>
                ))}
            </select>
        </div>
    );
}
