interface Props {
    onClick?: () => void;
    text: string;
    darkMode?: boolean;
}


export default function ButtonRed({text}: Props) {
    return (
        <button type="button"
                className={`text-white w-32 bg-red-700 hover:bg-red-800 font-medium rounded-lg text-xl px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800`}>{text}</button>

    );

};