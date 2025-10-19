import React, { useState, useCallback } from 'react';
import type { AITrendReport, ContentType, TrendingIdea } from '../types';
import { CONTENT_TYPES } from '../constants';
import { generateTrendingIdeas, generateInspirationalImage } from '../services/geminiService';
import Spinner from './Spinner';
import { ChartBarIcon, CopyIcon, CameraIcon } from './icons';

const IdeaCard: React.FC<{
  idea: TrendingIdea;
  contentType: ContentType;
}> = ({ idea, contentType }) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError(null);
    try {
      const imageData = await generateInspirationalImage(idea.title, contentType);
      setGeneratedImage(`data:image/jpeg;base64,${imageData}`);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Unknown image error.');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  const handleCopyKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50">
      <h5 className="font-semibold text-slate-100">{idea.title}</h5>
      <p className="text-sm text-slate-400 mt-1">{idea.description}</p>
      <div className="mt-3 flex items-center flex-wrap gap-2">
        {idea.keywords.map(kw => (
          <span key={kw} className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded-full font-medium">{kw}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button onClick={() => handleCopyKeywords(idea.keywords)} className="text-xs text-cyan-400 hover:text-cyan-200 font-medium flex items-center transition-colors">
            <CopyIcon className="w-4 h-4 mr-1" />
            {copied ? 'Copied!' : 'Copy Keywords'}
        </button>
        <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="text-xs text-fuchsia-400 hover:text-fuchsia-200 font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-wait">
            <CameraIcon className="w-4 h-4 mr-1" />
            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
       {isGeneratingImage && (
        <div className="mt-4 flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-md">
            <Spinner size="md" />
            <p className="text-sm text-slate-400 mt-2">AI is creating your image...</p>
        </div>
       )}
       {imageError && <p className="mt-2 text-xs text-red-400">{imageError}</p>}
       {generatedImage && (
        <div className="mt-4 rounded-lg overflow-hidden shadow-lg animate-fade-in shadow-black/50 ring-1 ring-cyan-500/20">
          <img src={generatedImage} alt={`AI-generated image for ${idea.title}`} className="w-full h-auto object-cover" />
        </div>
      )}
    </div>
  );
};

const TrendExplorer: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [contentType, setContentType] = useState<ContentType>(CONTENT_TYPES[0]);
  const [aiReport, setAiReport] = useState<AITrendReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [hasSearched, setHasSearched] = useState(false);

  const handleGenerateTrends = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme) {
        setError('Please enter a theme to explore.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setAiReport(null);
    setHasSearched(true);
    try {
      const report = await generateTrendingIdeas(theme, contentType);
      setAiReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [theme, contentType]);

  return (
    <div className="glassmorphism p-4 sm:p-6 rounded-xl">
      <form onSubmit={handleGenerateTrends} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div className="lg:col-span-1">
          <label htmlFor="theme" className="block text-sm font-medium text-gray-400 mb-1">Theme or Topic</label>
          <input
            type="text"
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., 'Sustainability', 'Vintage Tech'"
            className="w-full px-3 py-2 rounded-md shadow-sm dark-input"
          />
        </div>
        <div>
          <label htmlFor="trend-content-type" className="block text-sm font-medium text-gray-400 mb-1">Content Type</label>
          <select
            id="trend-content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full px-3 py-2 rounded-md shadow-sm dark-input"
          >
            {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cyan-500 text-slate-900 font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 disabled:bg-cyan-500/30 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(0,246,255,0.5)]"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="ml-2">Finding Trends...</span>
            </>
          ) : (
             <>
              <ChartBarIcon className="w-5 h-5 mr-2" />
              <span>Explore Trends</span>
             </>
          )}
        </button>
      </form>
      
      {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

      <div className="mt-8">
        {isLoading && (
            <div className="flex justify-center items-center py-10">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-400 font-medium animate-pulse">Generating trend report...</p>
                </div>
            </div>
        )}

        {!isLoading && !aiReport && !hasSearched && (
            <div className="text-center py-10 rounded-lg bg-slate-900/20">
                <ChartBarIcon className="w-12 h-12 text-cyan-400 mx-auto" />
                <h2 className="text-2xl font-bold text-slate-100 mt-4">Explore Content Trends</h2>
                <p className="mt-2 text-slate-400 max-w-md mx-auto">Enter a theme or topic to discover trending concepts, keywords, and audience insights with AI.</p>
            </div>
        )}
        
        {!isLoading && !aiReport && hasSearched && (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold text-gray-200">No Trends Found</h2>
                <p className="mt-2 text-gray-400">The AI couldn't generate a report for this topic. Please try a different theme.</p>
            </div>
        )}

        {aiReport && (
            <div className="animate-slide-up-fade-in space-y-6">
                 <div>
                    <h4 className="font-semibold text-slate-200">Audience Tip:</h4>
                    <p className="text-sm text-cyan-200 italic mt-1 bg-cyan-900/30 p-3 rounded-md border border-cyan-500/20">"{aiReport.audienceTip}"</p>
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-100 mb-4">Trending Concepts for "{theme}"</h3>
                    <div className="space-y-4">
                        {aiReport.ideas.map((idea, index) => (
                          <IdeaCard key={index} idea={idea} contentType={contentType} />
                        ))}
                    </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TrendExplorer;