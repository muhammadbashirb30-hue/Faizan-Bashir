import React, { useState, useEffect, useCallback } from 'react';
import type { HotTopic, KeywordStrategy } from '../types';
import { getGlobalHotTopics, generateKeywordStrategy } from '../services/geminiService';
import Spinner from './Spinner';
import { GlobeAltIcon, CopyIcon } from './icons';

const KeywordResult: React.FC<{ title: string; keywords: string[] }> = ({ title, keywords }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(keywords.join(', '));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800">{title}</h4>
                <button onClick={handleCopy} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors">
                    <CopyIcon className="w-4 h-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy All'}
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                    <span key={kw} className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">{kw}</span>
                ))}
            </div>
        </div>
    );
};


const MarketPulse: React.FC = () => {
    // State for Hot Topics
    const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
    const [isTopicsLoading, setIsTopicsLoading] = useState(true);
    const [topicsError, setTopicsError] = useState<string | null>(null);

    // State for Keyword Strategist
    const [topic, setTopic] = useState('');
    const [keywordStrategy, setKeywordStrategy] = useState<KeywordStrategy | null>(null);
    const [isKeywordsLoading, setIsKeywordsLoading] = useState(false);
    const [keywordsError, setKeywordsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHotTopics = async () => {
            try {
                setIsTopicsLoading(true);
                setTopicsError(null);
                const topics = await getGlobalHotTopics();
                setHotTopics(topics);
            } catch (err) {
                setTopicsError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsTopicsLoading(false);
            }
        };
        fetchHotTopics();
    }, []);
    
    const handleStrategySubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) {
            setKeywordsError('Please enter a topic.');
            return;
        }
        try {
            setIsKeywordsLoading(true);
            setKeywordsError(null);
            setKeywordStrategy(null);
            const strategy = await generateKeywordStrategy(topic);
            setKeywordStrategy(strategy);
        } catch (err) {
            setKeywordsError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsKeywordsLoading(false);
        }
    }, [topic]);

    return (
        <div className="space-y-12">
            {/* Hot Topics Section */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <GlobeAltIcon className="w-8 h-8 text-blue-600" />
                    What's Hot Right Now?
                </h2>
                <div className="glassmorphism p-4 sm:p-6 rounded-xl">
                    {isTopicsLoading && (
                        <div className="flex justify-center items-center py-10">
                            <div className="text-center">
                                <Spinner size="lg" />
                                <p className="mt-4 text-gray-600 font-medium">Scanning global trends...</p>
                            </div>
                        </div>
                    )}
                    {topicsError && <p className="text-center text-red-500">{topicsError}</p>}
                    {!isTopicsLoading && !topicsError && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotTopics.map((item) => (
                                <div key={item.topic} className="bg-white/50 p-5 rounded-lg border border-gray-200/80 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-gray-400/10">
                                    <h3 className="font-bold text-blue-600 text-lg">{item.topic}</h3>
                                    <p className="text-gray-600 text-sm mt-2">{item.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            
            {/* Keyword Strategist Section */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    Keyword Deep Dive
                </h2>
                <div className="glassmorphism p-4 sm:p-6 rounded-xl">
                    <form onSubmit={handleStrategySubmit} className="flex flex-col sm:flex-row items-end gap-4 mb-8">
                        <div className="w-full">
                            <label htmlFor="keyword-topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                            <input
                                type="text"
                                id="keyword-topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., 'Minimalist Interior Design'"
                                className="w-full px-3 py-2 rounded-md shadow-sm light-input"
                            />
                        </div>
                        <button
                          type="submit"
                          disabled={isKeywordsLoading}
                          className="w-full sm:w-auto bg-purple-600 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30"
                        >
                          {isKeywordsLoading ? 'Analyzing...' : 'Get Strategy'}
                        </button>
                    </form>

                    {keywordsError && <p className="text-center text-red-500 mb-4">{keywordsError}</p>}
                    
                    {isKeywordsLoading && (
                        <div className="flex justify-center items-center py-10">
                             <div className="text-center">
                                <Spinner size="lg" />
                                <p className="mt-4 text-gray-600 font-medium">Generating keyword report...</p>
                            </div>
                        </div>
                    )}

                    {keywordStrategy && (
                        <div className="space-y-6 animate-fade-in">
                            <KeywordResult title="Primary Keywords" keywords={keywordStrategy.primaryKeywords} />
                            <KeywordResult title="Long-Tail Keywords" keywords={keywordStrategy.longTailKeywords} />
                            <KeywordResult title="Related Concepts & LSI" keywords={keywordStrategy.relatedConcepts} />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MarketPulse;