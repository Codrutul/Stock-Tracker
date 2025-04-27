interface Properties {
    name: string
    onClick: () => void
    darkMode?: boolean
    disabled?: boolean
}

function Button_new({name, onClick, darkMode = false, disabled = false}: Properties) {

    return (
        <button
            onClick={onClick}
            className={`${darkMode ? "bg-blue-400" : "bg-blue-500"} ${darkMode ? "hover:bg-blue-600" : "hover:bg-blue-700"} text-white font-bold py-2 px-4 rounded ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{transition: "background-color 0.5s ease-in-out"}}
            disabled={disabled}
        >
            {name}
        </button>
    );
}

export default Button_new;