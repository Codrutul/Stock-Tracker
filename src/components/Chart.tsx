import {useEffect, useRef} from "react";
import Stock from "../classes/Stock";

interface ChartProps {
  stockData?: Stock | null;
}

export default function Chart({ stockData }: ChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // If we have stock data, we could use it to influence the chart
        // For now we'll just generate random data
        const dataPoints = 20;
        const margin = 50;
        const chartWidth = canvas.width - (margin * 2);
        const chartHeight = canvas.height - (margin * 2);
        
        // Set background
        ctx.fillStyle = "#f8f9fa";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate random data points (could be based on stock price in a real implementation)
        const points = [];
        const maxVariation = stockData ? stockData.price * 0.2 : 20;
        
        for (let i = 0; i < dataPoints; i++) {
            const x = margin + (i * (chartWidth / (dataPoints - 1)));
            const randomVariation = Math.random() * maxVariation - (maxVariation / 2);
            const y = margin + chartHeight / 2 - randomVariation;
            points.push({ x, y });
        }
        
        // Draw connecting lines
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = stockData && stockData.change >= 0 ? "#22c55e" : "#ef4444"; // Green or red based on stock change
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Add points
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = stockData && stockData.change >= 0 ? "#22c55e" : "#ef4444";
            ctx.fill();
        });
        
        // Add labels
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        
        // Add company name if available
        if (stockData) {
            ctx.font = "bold 16px Arial";
            ctx.fillText(`${stockData.name} - Price Chart`, canvas.width / 2, 25);
        }
    }, [stockData]); // Re-render chart when stockData changes

    return (
        <div style={{width: 790, height: 425}} className="bg-white mt-3">
            <canvas
                ref={canvasRef}
                width={790}
                height={425}
                style={{border: "1px solid #ddd", borderRadius: "4px"}}
            />
        </div>
    );
};