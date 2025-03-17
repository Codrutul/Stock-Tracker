interface Props {
    onClick?: () => void;
    text: string;
    darkMode?: boolean;
}

export default function ButtonGreen({text}: Props) {
    return (
        <button type="button"

                className={`text-white w-32 bg-green-700 hover:bg-green-800 rounded-lg text-xl px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800`}>{text}</button>

    );

};