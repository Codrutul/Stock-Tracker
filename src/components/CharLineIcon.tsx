interface Props {
  onClick?: () => void;
}

export default function ChartLineIcon({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-600"
      >
        <path d="M3 3v18h18" />
        <path d="M19 9l-5 5-4-4-3 3" />
      </svg>
    </button>
  );
}
