import {useState} from 'react';
import {Slider} from '@mui/material';

interface RangeSliderProps {
    onValuesChange?: (min: number, max: number) => void;
    initialMin?: number;
    initialMax?: number;
}

export default function RangeSlider({onValuesChange, initialMin = 0, initialMax = 1000}: RangeSliderProps) {
    const [value, setValue] = useState<number[]>([initialMin, initialMax]);

    const handleChange = (_event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            setValue(newValue);
            const [min, max] = newValue;

            // Update the input fields
            const minInput = document.getElementById('min-price-input') as HTMLInputElement;
            const maxInput = document.getElementById('max-price-input') as HTMLInputElement;
            if (minInput) minInput.value = min.toString();
            if (maxInput) maxInput.value = max.toString();

            // Notify parent component if callback provided
            if (onValuesChange) {
                onValuesChange(min, max);
            }
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, isMin: boolean) => {
        const newValue = Number(event.target.value);
        if (isNaN(newValue)) return;

        if (isMin) {
            setValue([Math.min(newValue, value[1] - 1), value[1]]);
        } else {
            setValue([value[0], Math.max(newValue, value[0] + 1)]);
        }

        if (onValuesChange) {
            onValuesChange(value[0], value[1]);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Filter by Stock Price</h3>

            {/* Slider */}
            <div className="px-3 py-5">
                <Slider
                    value={value}
                    onChange={handleChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={1}
                    sx={{
                        color: '#3b82f6', // Tailwind blue-500
                        '& .MuiSlider-thumb': {
                            backgroundColor: '#ffffff',
                            border: '2px solid currentColor',
                        },
                        '& .MuiSlider-track': {
                            border: 'none',
                        },
                        '& .MuiSlider-valueLabel': {
                            backgroundColor: '#3b82f6',
                        },
                    }}
                />
            </div>

            {/* Input fields */}
            <div className="flex gap-4 mt-2">
                <div className="flex-1">
                    <label htmlFor="min-price-input" className="block text-sm font-medium mb-2">
                        Min Price ($)
                    </label>
                    <input
                        type="number"
                        id="min-price-input"
                        value={value[0]}
                        onChange={(e) => handleInputChange(e, true)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="max-price-input" className="block text-sm font-medium mb-2">
                        Max Price ($)
                    </label>
                    <input
                        type="number"
                        id="max-price-input"
                        value={value[1]}
                        onChange={(e) => handleInputChange(e, false)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}