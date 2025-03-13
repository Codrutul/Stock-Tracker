export default function NewsIcon() {
    return (
        <svg
            className="cursor-pointer news-icon transition-colors duration-300 ease-in-out"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeMiterlimit="10"
        >
            {/* Outer rectangle shape */}
            <path d="M27,5V3H1v26 c0,1.105,0.895,2,2,2h26c1.105,0,2-0.895,2-2V5H27z"/>

            {/* Inner rectangle */}
            <rect x="5" y="19" width="10" height="8"/>

            {/* Vertical lines on the right */}
            <line x1="27" y1="5" x2="27" y2="24"/>
            <line x1="27" y1="26" x2="27" y2="28"/>

            {/* Horizontal lines */}
            <line x1="4" y1="7" x2="24" y2="7"/>
            <line x1="4" y1="11" x2="24" y2="11"/>
            <line x1="4" y1="15" x2="24" y2="15"/>
            <line x1="18" y1="19" x2="24" y2="19"/>
            <line x1="18" y1="23" x2="24" y2="23"/>
            <line x1="18" y1="27" x2="24" y2="27"/>
        </svg>
    );
}
