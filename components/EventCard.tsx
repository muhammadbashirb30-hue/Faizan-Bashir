import React, { useState, useCallback } from 'react';
import type { Event, AIContent, ContentType, ContentIdea } from '../types';
import { COUNTRIES } from '../constants';
import { generateContentIdeas, generateInspirationalImage } from '../services/geminiService';
import Spinner from './Spinner';
import { ChevronDownIcon, SparklesIcon, CopyIcon, CameraIcon } from './icons';

interface EventCardProps {
  event: Event;
  contentType: ContentType;
}

const IdeaCard: React.FC<{
  idea: ContentIdea;
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


const EventCard: React.FC<EventCardProps> = ({ event, contentType }) => {
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const country = COUNTRIES.find(c => c.code === event.country);

  const handleGenerateIdeas = useCallback(async () => {
    if (aiContent) {
      setIsOpen(!isOpen);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOpen(true);
    try {
      const content = await generateContentIdeas(event.name, contentType);
      setAiContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [aiContent, contentType, event.name, isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  };

  return (
    <div className="bg-slate-900/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 border border-slate-800/50 hover:border-cyan-500/30">
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-cyan-400">{formatDate(event.date)}</p>
                <h3 className="text-xl font-bold text-slate-100 mt-1">{event.name}</h3>
                <p className="text-slate-400 mt-2 text-sm">{event.description}</p>
            </div>
            <span className="text-4xl ml-4 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{country?.flag}</span>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleGenerateIdeas}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-bold rounded-md text-slate-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 disabled:bg-gray-600 disabled:text-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_15px_rgba(0,246,255,0.4)]"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
               <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                <span>{aiContent ? (isOpen ? 'Hide Insights' : 'Show AI Insights') : 'Generate AI Insights'}</span>
                {aiContent && <ChevronDownIcon className={`w-5 h-5 ml-2 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
               </>
            )}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {isOpen && aiContent && (
          <div className="mt-6 animate-fade-in">
            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="font-semibold text-slate-200">Upload Tip:</h4>
              <p className="text-sm text-cyan-200 italic mt-1 bg-cyan-900/30 p-3 rounded-md border border-cyan-500/20">"{aiContent.uploadTip}"</p>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-slate-200 mb-2">Content Ideas:</h4>
              <div className="space-y-4">
                {aiContent.ideas.map((idea, index) => (
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

export default EventCard;