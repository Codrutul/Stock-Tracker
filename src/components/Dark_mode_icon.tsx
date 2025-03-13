import {useState} from "react";

interface Properties {
    image_src: string;
    desc: string;
    image_src_hover?: string
    onClick?: () => void;
}

function Dark_mode_icon({image_src, desc, image_src_hover, onClick}: Properties) {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked((prev) => !prev);
        setIsHovered(false);
    };

    return (
        <div onClick={onClick}>
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
                style={{
                    marginTop: "7px",
                    width: "24px",
                    height: "24px",
                    position: "relative",
                    cursor: "pointer",
                }}
            >
                <img
                    src={image_src}
                    alt={desc}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        transition: "opacity 0.3s ease-in-out",
                        opacity: (isHovered || isClicked) ? 0 : 1,
                    }}
                />
                <img
                    src={image_src_hover}
                    alt={desc}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        transition: "opacity 0.3s ease-in-out",
                        opacity: (isHovered || isClicked) ? 1 : 0,
                    }}
                />
            </div>
        </div>
    );
}

export default Dark_mode_icon;
