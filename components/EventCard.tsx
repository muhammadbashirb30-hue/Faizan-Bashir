import React, { useState, useCallback } from 'react';
import type { Event, AIContent, ContentType, ContentIdea } from '../types';
import { COUNTRIES } from '../constants';
import { generateContentIdeas, generateInspirationalImage } from '../services/geminiService';
import Spinner from './Spinner';
import { ChevronDownIcon, SparklesIcon, CopyIcon, CameraIcon, CashIcon } from './icons';
import SellingConceptCard from './SellingConceptCard';

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
    <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 border border-gray-200/80 hover:border-blue-500/30">
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-blue-600">{formatDate(event.date)}</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{event.name}</h3>
                <p className="text-gray-600 mt-2 text-sm">{event.description}</p>
            </div>
            <span className="text-4xl ml-4 drop-shadow-[0_2px_3px_rgba(0,0,0,0.1)]">{country?.flag}</span>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleGenerateIdeas}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-bold rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/40"
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

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {isOpen && aiContent && (
          <div className="mt-6 animate-fade-in">
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-800">Upload Tip:</h4>
              <p className="text-sm text-blue-800 italic mt-1 bg-blue-50 p-3 rounded-md border border-blue-200/50">"{aiContent.uploadTip}"</p>
            </div>

            {aiContent.topSellingConcepts && aiContent.topSellingConcepts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200/60">
                <h4 className="font-semibold text-gray-800 flex items-center mb-2">
                  <CashIcon className="w-5 h-5 mr-2 text-green-600" />
                  Top-Selling Concepts
                </h4>
                <div className="space-y-4">
                  {aiContent.topSellingConcepts.map((concept, index) => (
                    <SellingConceptCard key={index} concept={concept} contentType={contentType} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200/60">
              <h4 className="font-semibold text-gray-800 mb-2">Creative Content Ideas:</h4>
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
