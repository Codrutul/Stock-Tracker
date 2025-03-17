import {useEffect, useRef} from "react";

export default function Chart() {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 10; i++) {
            const x = Math.random() * (canvas.width - 50);
            const y = Math.random() * (canvas.height - 50);
            const size = 20 + Math.random() * 30; // random size between 20–50
            ctx.fillStyle = randomColor();
            ctx.fillRect(x, y, size, size);
        }
    }, []);

    const randomColor = (): string => {
        return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    };

    return (
        <div style={{width: 790, height: 425}} className="bg-white mt-3">
            <canvas
                ref={canvasRef}
                width={790}
                height={425}
                style={{border: "1px solid black"}}
            />
        </div>
    );
};