interface Props {
  onClick?: () => void;
}

export default function DonutChartIcon({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
    >
      <svg
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#006adb"
        stroke-width="0.12"
        width={24}
        height={24}
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            d="M7.5 14C3.91015 14 1 11.0899 1 7.5H0C0 11.6421 3.35786 15 7.5 15V14ZM14 7.5C14 11.0899 11.0899 14 7.5 14V15C11.6421 15 15 11.6421 15 7.5H14ZM7.5 1C11.0899 1 14 3.91015 14 7.5H15C15 3.35786 11.6421 0 7.5 0V1ZM7.5 0C3.35786 0 0 3.35786 0 7.5H1C1 3.91015 3.91015 1 7.5 1V0ZM10.197 6.45957L13.697 4.95957L13.303 4.04043L9.80304 5.54043L10.197 6.45957ZM7 0V4.5H8V0H7ZM9.14645 9.85355L12.1464 12.8536L12.8536 12.1464L9.85355 9.14645L9.14645 9.85355ZM7.5 10C6.11929 10 5 8.88071 5 7.5H4C4 9.433 5.567 11 7.5 11V10ZM10 7.5C10 8.88071 8.88071 10 7.5 10V11C9.433 11 11 9.433 11 7.5H10ZM7.5 5C8.88071 5 10 6.11929 10 7.5H11C11 5.567 9.433 4 7.5 4V5ZM7.5 4C5.567 4 4 5.567 4 7.5H5C5 6.11929 6.11929 5 7.5 5V4Z"
            fill="#006adb"
          ></path>
        </g>
      </svg>
    </button>
  );
}
