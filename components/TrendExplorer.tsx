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
    <div className="bg-gray-50/60 p-4 rounded-lg border border-gray-200/80">
      <h5 className="font-semibold text-gray-900">{idea.title}</h5>
      <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
      <div className="mt-3 flex items-center flex-wrap gap-2">
        {idea.keywords.map(kw => (
          <span key={kw} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{kw}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button onClick={() => handleCopyKeywords(idea.keywords)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
            <CopyIcon className="w-4 h-4 mr-1" />
            {copied ? 'Copied!' : 'Copy Keywords'}
        </button>
        <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-wait">
            <CameraIcon className="w-4 h-4 mr-1" />
            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
       {isGeneratingImage && (
        <div className="mt-4 flex flex-col items-center justify-center p-4 bg-gray-100/50 rounded-md">
            <Spinner size="md" />
            <p className="text-sm text-gray-600 mt-2">AI is creating your image...</p>
        </div>
       )}
       {imageError && <p className="mt-2 text-xs text-red-500">{imageError}</p>}
       {generatedImage && (
        <div className="mt-4 rounded-lg overflow-hidden shadow-lg animate-fade-in shadow-gray-400/30 ring-1 ring-gray-900/5">
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
  
  const suggestions = ["AI & Technology", "Nature & Environment", "Health & Wellness", "Abstract Art", "Business & Finance", "Retro Futurism"];

  const performTrendSearch = useCallback(async (currentTheme: string, currentContentType: ContentType) => {
    if (!currentTheme) {
        setError('Please enter a theme to explore.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setAiReport(null);
    setHasSearched(true);
    try {
      const report = await generateTrendingIdeas(currentTheme, currentContentType);
      setAiReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateTrends = (e: React.FormEvent) => {
    e.preventDefault();
    performTrendSearch(theme, contentType);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTheme(suggestion);
    performTrendSearch(suggestion, contentType);
  }

  return (
    <div className="glassmorphism p-4 sm:p-6 rounded-xl">
      <form onSubmit={handleGenerateTrends} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div className="lg:col-span-1">
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">Theme or Topic</label>
          <input
            type="text"
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., 'Sustainability', 'Vintage Tech'"
            className="w-full px-3 py-2 rounded-md shadow-sm light-input"
          />
        </div>
        <div>
          <label htmlFor="trend-content-type" className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
          <select
            id="trend-content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full px-3 py-2 rounded-md shadow-sm light-input"
          >
            {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
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
      
      {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}

      <div className="mt-8">
        {isLoading && (
            <div className="flex justify-center items-center py-10">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600 font-medium animate-pulse">Generating trend report...</p>
                </div>
            </div>
        )}

        {!isLoading && !aiReport && !hasSearched && (
            <div className="text-center py-10 rounded-lg bg-gray-50/50">
                <ChartBarIcon className="w-16 h-16 text-blue-500 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-800 mt-4">Explore Content Trends</h2>
                <p className="mt-2 text-gray-600 max-w-md mx-auto text-lg">Enter a theme or topic to discover trending concepts, keywords, and audience insights with AI.</p>
                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Need inspiration? Try a popular theme:</h3>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {suggestions.map(s => (
                            <button key={s} onClick={() => handleSuggestionClick(s)} className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all transform hover:scale-105">
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {!isLoading && !aiReport && hasSearched && (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold text-gray-800">No Trends Found</h2>
                <p className="mt-2 text-gray-600">The AI couldn't generate a report for this topic. Please try a different theme.</p>
            </div>
        )}

        {aiReport && (
            <div className="animate-slide-up-fade-in space-y-6">
                 <div>
                    <h4 className="font-semibold text-gray-800">Audience Tip:</h4>
                    <p className="text-sm text-blue-800 italic mt-1 bg-blue-50 p-3 rounded-md border border-blue-200/50">"{aiReport.audienceTip}"</p>
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Trending Concepts for "{theme}"</h3>
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