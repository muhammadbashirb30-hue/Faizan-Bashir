import React from 'react';
import { ImageIcon } from './icons';
import type { ContentType } from '../types';

interface InspirationGalleryProps {
    images: string[];
    isLoading: boolean;
    error: string | null;
    query: string;
    contentType: ContentType;
}

const SkeletonLoader: React.FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array(4).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-800/50 rounded-lg"></div>
        ))}
    </div>
);

const InspirationGallery: React.FC<InspirationGalleryProps> = ({ images, isLoading, error, query, contentType }) => {
    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
                <ImageIcon className="w-6 h-6 mr-3 text-cyan-400" />
                Visual Inspiration
            </h2>
            <div className="glassmorphism p-4 sm:p-6 rounded-xl">
                {isLoading && (
                    <div>
                        <p className="text-sm text-center text-slate-400 mb-4">Generating {contentType} inspiration for "{query}"...</p>
                        <SkeletonLoader />
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center py-8">
                        <p className="text-red-400">Sorry, the AI couldn't generate visual inspiration for this topic.</p>
                        <p className="text-xs text-slate-500 mt-1">{error}</p>
                    </div>
                )}
                {!isLoading && !error && images.length > 0 && (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((imgData, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden group relative transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20">
                                <img 
                                    src={`data:image/jpeg;base64,${imgData}`} 
                                    alt={`AI-generated inspiration for ${query} ${index + 1}`} 
                                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InspirationGallery;