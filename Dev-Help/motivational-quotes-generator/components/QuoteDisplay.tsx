
import React, { useState, useCallback } from 'react';
import CopyIcon from './CopyIcon';
import CheckIcon from './CheckIcon';

interface QuoteDisplayProps {
    quote: string;
}

const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ quote }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!quote) return;
        navigator.clipboard.writeText(quote)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch(err => console.error('Failed to copy text: ', err));
    }, [quote]);

    return (
        <div className="relative w-full">
            <blockquote className="text-center">
                <p className="text-2xl sm:text-3xl font-serif italic text-slate-200 leading-relaxed">
                    “{quote}”
                </p>
            </blockquote>
            <button 
                onClick={handleCopy}
                className="absolute -top-2 -right-2 p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Copy quote to clipboard"
            >
                {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5 text-slate-400" />}
            </button>
        </div>
    );
};

export default QuoteDisplay;
