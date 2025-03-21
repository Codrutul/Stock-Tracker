export default function ChartIcon() {
  return (
    <div className="flex flex-col justify-center items-center">
      <button className="bg-white">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={30}
          height={30}
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M21 10C21 6.13401 17.866 3 14 3V10H21Z"
              stroke="#000000"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="M11 21C15.4183 21 19 17.4183 19 13H11V5C6.58172 5 3 8.58172 3 13C3 17.4183 6.58172 21 11 21Z"
              stroke="#000000"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </button>
      <label>Pie Chart</label>
    </div>
  );
}
