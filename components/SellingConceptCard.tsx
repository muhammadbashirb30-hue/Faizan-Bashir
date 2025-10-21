import React, { useState } from 'react';
import type { ContentType, SellingConcept } from '../types';
import { generateInspirationalImage } from '../services/geminiService';
import Spinner from './Spinner';
import { CameraIcon, CopyIcon, TagIcon, UserIcon } from './icons';

interface SellingConceptCardProps {
  concept: SellingConcept;
  contentType: ContentType;
}

const SellingConceptCard: React.FC<SellingConceptCardProps> = ({ concept, contentType }) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError(null);
    try {
      // Use the more detailed description for a better visualization
      const imageData = await generateInspirationalImage(concept.description, contentType);
      setGeneratedImage(`data:image/jpeg;base64,${imageData}`);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Unknown image error.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyKeywords = () => {
    navigator.clipboard.writeText(concept.keywords.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50/60 p-4 rounded-lg border border-gray-200/80 space-y-4">
      <h5 className="font-semibold text-gray-900">{concept.concept}</h5>
      <p className="text-sm text-gray-700">{concept.description}</p>
      
      <div className="flex items-center text-sm text-gray-600 bg-gray-200/50 p-2 rounded-md">
        <UserIcon className="w-5 h-5 mr-2 text-indigo-500 flex-shrink-0" />
        <div>
            <strong className="font-semibold text-gray-800">Target Audience:</strong>
            <span className="ml-1.5">{concept.targetAudience}</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
            <h6 className="text-sm font-semibold text-gray-800 flex items-center">
              <TagIcon className="w-4 h-4 mr-2 text-indigo-500" />
              Commercial Keywords
            </h6>
            <button onClick={handleCopyKeywords} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
                <CopyIcon className="w-4 h-4 mr-1" />
                {copied ? 'Copied!' : 'Copy Keywords'}
            </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {concept.keywords.map(kw => (
            <span key={kw} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">{kw}</span>
            ))}
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-200/60">
        <button 
          onClick={handleGenerateImage} 
          disabled={isGeneratingImage} 
          className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <CameraIcon className="w-4 h-4 mr-1" />
          {isGeneratingImage ? 'Visualizing...' : 'Visualize Concept'}
        </button>
      </div>

      {isGeneratingImage && (
        <div className="mt-4 flex flex-col items-center justify-center p-4 bg-gray-100/50 rounded-md">
          <Spinner size="md" />
          <p className="text-sm text-gray-600 mt-2">AI is visualizing the concept...</p>
        </div>
      )}
      {imageError && <p className="mt-2 text-xs text-red-500">{imageError}</p>}
      {generatedImage && (
        <div className="mt-4 rounded-lg overflow-hidden shadow-lg animate-fade-in shadow-gray-400/30 ring-1 ring-gray-900/5">
          <img src={generatedImage} alt={`AI-generated image for ${concept.concept}`} className="w-full h-auto object-cover" />
        </div>
      )}
    </div>
  );
};

export default SellingConceptCard;