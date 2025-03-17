export default function SharesInput() {
    return (
        <div className="w-1/2">
            <div
                className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600  focus-within:outline-indigo-600 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2">
                <input
                    id="price"
                    name="price"
                    type="text"
                    placeholder="Ammount of shares"
                    className="block min-w-0 grow py-1.5 pl-1 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 text-xl"
                />

            </div>
        </div>
    )

}