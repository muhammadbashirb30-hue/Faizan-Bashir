import React, { useState, useCallback, useRef } from 'react';
import type { StockMetadata, ContentType } from '../types';
import { CONTENT_TYPES } from '../constants';
import { generateStockMetadata } from '../services/geminiService';
import Spinner from './Spinner';
import { TagIcon, CopyIcon, ArrowUpTrayIcon, XCircleIcon } from './icons';

const MetadataCard: React.FC<{ result: StockMetadata }> = ({ result }) => {
    const [titleCopied, setTitleCopied] = useState(false);
    const [keywordsCopied, setKeywordsCopied] = useState(false);

    const handleCopy = (text: string, type: 'title' | 'keywords') => {
        navigator.clipboard.writeText(text);
        if (type === 'title') {
            setTitleCopied(true);
            setTimeout(() => setTitleCopied(false), 2000);
        } else {
            setKeywordsCopied(true);
            setTimeout(() => setKeywordsCopied(false), 2000);
        }
    };

    return (
        <div className="bg-white/50 p-5 rounded-lg border border-gray-200/80">
            <h3 className="font-bold text-blue-600 text-xl mb-4">{result.platform}</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm">Generated Title</h4>
                        <button onClick={() => handleCopy(result.title, 'title')} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
                           <CopyIcon className="w-3 h-3 mr-1" />
                           {titleCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-base text-gray-700 bg-gray-100 p-3 rounded-md">{result.title}</p>
                </div>
                <div>
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm">Keywords ({result.keywords.length})</h4>
                        <button onClick={() => handleCopy(result.keywords.join(', '), 'keywords')} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
                           <CopyIcon className="w-3 h-3 mr-1" />
                           {keywordsCopied ? 'Copied!' : 'Copy All'}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 rounded-md bg-gray-100 max-h-48 overflow-y-auto">
                        {result.keywords.map(kw => (
                             <span key={kw} className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">{kw}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};


const MetadataGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<ContentType>(CONTENT_TYPES[0]);
  const [metadata, setMetadata] = useState<StockMetadata[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); 
        };
        reader.onerror = error => reject(error);
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            setError("Image size must be less than 4MB.");
            return;
        }
        setImageFile(file);
        setError(null);
        try {
            const base64 = await fileToBase64(file);
            setImageBase64(base64);
        } catch (error) {
            setError("Failed to read the image file.");
            setImageFile(null);
            setImageBase64(null);
        }
    }
  };

  const handleRemoveImage = () => {
      setImageFile(null);
      setImageBase64(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic && !imageFile) {
        setError('Please enter a topic or upload an image to generate metadata.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setMetadata(null);
    setHasSearched(true);
    try {
      const imageData = imageBase64 && imageFile ? { data: imageBase64, mimeType: imageFile.type } : undefined;
      const result = await generateStockMetadata(topic, contentType, imageData);
      setMetadata(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, contentType, imageFile, imageBase64]);

  return (
    <div className="glassmorphism p-4 sm:p-6 rounded-xl">
       <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <label htmlFor="metadata-topic" className="block text-sm font-medium text-gray-700 mb-1">Content Topic / Description</label>
              <input
                type="text"
                id="metadata-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 'Smiling family having a picnic'"
                className="w-full px-3 py-2 rounded-md shadow-sm light-input"
              />
              <p className="text-xs text-gray-500 mt-1">Optional if uploading an image, but can help guide the AI.</p>
            </div>
            <div>
              <label htmlFor="metadata-content-type" className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                id="metadata-content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full px-3 py-2 rounded-md shadow-sm light-input"
              >
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
              />
            {imageBase64 && imageFile ? (
              <div className="relative group">
                <img 
                  src={`data:${imageFile.type};base64,${imageBase64}`} 
                  alt="Image preview"
                  className="rounded-lg w-full h-auto max-h-60 object-cover border border-gray-300"
                />
                <button 
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-50 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 cursor-pointer transition-colors"
              >
                <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-gray-400" />
                <span>Click to upload or drag & drop</span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (Max 4MB)</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
            <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
            >
            {isLoading ? (
                <>
                <Spinner size="sm" />
                <span className="ml-2">Generating...</span>
                </>
            ) : (
                <>
                <TagIcon className="w-5 h-5 mr-2" />
                <span>Generate Metadata</span>
                </>
            )}
            </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
      
      <div className="mt-8">
        {isLoading && (
            <div className="flex justify-center items-center py-10">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600 font-medium animate-pulse">Analyzing and generating metadata...</p>
                </div>
            </div>
        )}

        {!isLoading && !metadata && !hasSearched && (
            <div className="text-center py-10 rounded-lg bg-gray-50/50">
                <TagIcon className="w-16 h-16 text-blue-500 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-800 mt-4">Title & Keyword Generator</h2>
                <p className="mt-2 text-gray-600 max-w-lg mx-auto text-lg">Describe your content or upload an image to get SEO-optimized titles and keywords for Adobe Stock, Shutterstock, and more.</p>
            </div>
        )}

        {!isLoading && !metadata && hasSearched && (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold text-gray-800">No Metadata Generated</h2>
                <p className="mt-2 text-gray-600">The AI couldn't generate metadata. Please try being more descriptive or use a different image.</p>
            </div>
        )}

        {metadata && (
            <div className="animate-slide-up-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">
                {metadata.map((result) => (
                    <MetadataCard key={result.platform} result={result} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default MetadataGenerator;