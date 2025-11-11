import React, { useState, useRef, useCallback } from 'react';
import { generateQuote, generateBackgroundImage } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import PostPreview from './components/PostPreview';
import { Download, Zap, Star } from 'lucide-react';

const App: React.FC = () => {
  const [theme, setTheme] = useState<string>('success');
  const [quote, setQuote] = useState<string>('The secret of getting ahead is getting started.');
  const [imageUrl, setImageUrl] = useState<string>('https://picsum.photos/1080/1440');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const postRef = useRef<HTMLDivElement>(null);

  const handleGeneratePost = useCallback(async () => {
    if (!theme.trim()) {
      setError('Please enter a theme.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setQuote('');
    setImageUrl('');

    try {
      const generatedQuote = await generateQuote(theme);
      setQuote(generatedQuote);

      const generatedImageUrl = await generateBackgroundImage(theme);
      setImageUrl(generatedImageUrl);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate post. Please try again.';
      setError(errorMessage);
      // Reset to default
      setQuote('The secret of getting ahead is getting started.');
      setImageUrl('https://picsum.photos/1080/1440');
    } finally {
      setIsLoading(false);
    }
  }, [theme]);

  const handleDownload = useCallback(() => {
    if (postRef.current) {
      (window as any).htmlToImage.toPng(postRef.current, { quality: 1, pixelRatio: 1, width: 1080, height: 1440 })
        .then((dataUrl: string) => {
          const link = document.createElement('a');
          link.download = `motivational_post_${theme.replace(/\s+/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err: Error) => {
          console.error('oops, something went wrong!', err);
          setError('Could not create image for download.');
        });
    }
  }, [theme]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
            <Star className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                Motivational Post Generator
            </h1>
        </div>
        <p className="text-lg text-gray-400">Craft viral Facebook posts with AI-powered quotes and backgrounds.</p>
      </header>

      <main className="w-full max-w-6xl flex-grow flex flex-col lg:flex-row gap-8 lg:gap-12">
        <aside className="lg:w-1/3 w-full">
          <ControlPanel
            theme={theme}
            setTheme={setTheme}
            onGenerate={handleGeneratePost}
            onDownload={handleDownload}
            isLoading={isLoading}
            isPostReady={!!(quote && imageUrl) && !isLoading}
          />
        </aside>

        <section className="lg:w-2/3 w-full flex-grow flex items-center justify-center">
           {error && <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg">{error}</div>}
           {!error && 
            <PostPreview
              ref={postRef}
              quote={quote}
              imageUrl={imageUrl}
              isLoading={isLoading}
            />
           }
        </section>
      </main>
    </div>
  );
};

export default App;