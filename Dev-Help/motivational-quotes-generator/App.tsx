
import React, { useState, useCallback } from 'react';
import { generateQuoteStream } from './services/geminiService';
import QuoteDisplay from './components/QuoteDisplay';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
    const [quote, setQuote] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateQuote = useCallback(async () => {
        setIsLoading(true);
        setQuote('');
        setError(null);

        try {
            const stream = await generateQuoteStream();
            for await (const chunk of stream) {
                setQuote((prevQuote) => prevQuote + chunk.text);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate a quote. Please check your connection or API key and try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-2xl mx-auto bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-cyan-500/10 border border-slate-700/50 overflow-hidden">
                <div className="p-6 sm:p-10">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                            InspireMe
                        </h1>
                        <p className="text-slate-400 mt-2">Your daily dose of unique motivation</p>
                    </header>
                    
                    <main className="min-h-[200px] flex items-center justify-center p-6 bg-slate-800/60 rounded-xl border border-slate-700">
                        {isLoading && <LoadingSpinner />}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        {!isLoading && !error && quote && <QuoteDisplay quote={quote} />}
                        {!isLoading && !error && !quote && (
                            <p className="text-slate-500 text-center text-lg">
                                Click the button to generate your unique motivational quote.
                            </p>
                        )}
                    </main>

                    <footer className="mt-8 text-center">
                        <button
                            onClick={handleGenerateQuote}
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isLoading ? 'Generating...' : 'Get a Quote'}
                        </button>
                    </footer>
                </div>
            </div>
            <div className="text-center mt-8 text-slate-600 text-sm">
                <p>Powered by Gemini</p>
            </div>
        </div>
    );
};

export default App;
