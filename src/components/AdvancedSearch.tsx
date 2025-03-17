import RangeSlider from "./RangeSlider";
import Button_new from "./Button_new";
import { useState } from 'react';

interface AdvancedSearchProps {
    onApply: (minPrice: number, maxPrice: number) => void;
    onClose: () => void;
    currentMinPrice: number;
    currentMaxPrice: number;
}

export default function AdvancedSearch({ onApply, onClose, currentMinPrice, currentMaxPrice }: AdvancedSearchProps) {
    const [minPrice, setMinPrice] = useState(currentMinPrice);
    const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

    const handleRangeChange = (min: number, max: number) => {
        setMinPrice(min);
        setMaxPrice(max);
    };

    const handleApply = () => {
        onApply(minPrice, maxPrice);
        onClose();
    };

    return (
        <div className="flex flex-col gap-4">
            <RangeSlider 
                onValuesChange={handleRangeChange}
                initialMin={currentMinPrice}
                initialMax={currentMaxPrice}
            />
            <div className="flex justify-end gap-2 mt-4">
                <Button_new name="Cancel" onClick={onClose} />
                <Button_new name="Apply" onClick={handleApply} />
            </div>
        </div>
    );
} 