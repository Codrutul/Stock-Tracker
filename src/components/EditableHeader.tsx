import * as React from "react";
import {useRef, useState} from "react";
import {Pencil} from "lucide-react";

interface Props {
    initial_text: string
    darkMode?: boolean;
}

export default function EditableHeader({initial_text}: Props) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [title, setTitle] = useState<string>(initial_text);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleEditClick = (): void => {
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleBlur = (): void => {
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            setIsEditing(false);
        }
    };

    return (
        <div className="relative w-fit group">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="border-b-2 border-gray-500 outline-none text-5xl font-bold bg-transparent pr-5 w-3/4"
                />
            ) : (
                <h1 className="text-5xl font-bold flex items-center space-x-8">
                    <span className="text-5xl">{title}</span>
                    <Pencil
                        className="w-6 h-6 text-black opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={handleEditClick}
                    />
                </h1>
            )}
        </div>
    );
}
