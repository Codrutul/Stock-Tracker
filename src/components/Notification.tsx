import {useEffect} from 'react';

interface NotificationProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    type?: 'error' | 'success' | 'info';
}

export default function Notification({message, isVisible, onClose, type = 'error'}: NotificationProps) {
    useEffect(() => {
        if (isVisible) {
            // Auto-hide notification after 3 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const bgColor =
        type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
            type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                'bg-blue-100 border-blue-400 text-blue-700';

    return (
        <div className={`flex items-center justify-center top-5 right-5 px-4 py-3 rounded border ${bgColor} shadow-md`}
             role="alert">
            <div className="flex items-center">
                <span className="font-medium mr-2">
                    {type === 'error' ? 'Error:' :
                        type === 'success' ? 'Success:' : 'Info:'}
                </span>
                <span>{message}</span>
                <button
                    className="ml-4 text-lg font-bold"
                    onClick={onClose}
                >
                    &times;
                </button>
            </div>
        </div>
    );
} 