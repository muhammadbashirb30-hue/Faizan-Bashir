import React, { useState, useCallback } from 'react';
import FilterBar from './components/FilterBar';
import EventGrid from './components/EventGrid';
import TrendExplorer from './components/TrendExplorer';
import InspirationGallery from './components/InspirationGallery';
import MarketPulse from './components/MarketPulse';
import MetadataGenerator from './components/MetadataGenerator';
import { findEvents, generateInspirationGallery } from './services/geminiService';
import type { Event, ContentType, GroundingSource } from './types';
import { CONTENT_TYPES, COUNTRIES, MONTHS } from './constants';
import { SparklesIcon, ChartBarIcon, GlobeAltIcon, TagIcon } from './components/icons';

type View = 'events' | 'trends' | 'market' | 'metadata';

const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSearchingEvents, setIsSearchingEvents] = useState<boolean>(false);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState<boolean>(false);
  
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [contentType, setContentType] = useState<ContentType>(CONTENT_TYPES[0]);
  const [error, setError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<View>('events');

  const handleSearch = useCallback(async (filters: { country: string; month: number; year: number; type: ContentType }) => {
    setHasSearched(true);
    setEvents([]);
    setSources([]);
    setInspirationImages([]);
    setError(null);
    setGalleryError(null);
    setContentType(filters.type);
    setIsSearchingEvents(true);
    setIsGeneratingGallery(true);

    const countryName = COUNTRIES.find(c => c.code === filters.country)?.name;
    const monthName = MONTHS.find(m => m.value === filters.month)?.name;

    if (!countryName || !monthName) {
      setError("Invalid country or month selected.");
      setIsSearchingEvents(false);
      setIsGeneratingGallery(false);
      return;
    }
    
    const query = `${monthName} in ${countryName}`;
    setSearchQuery(query);

    const eventsPromise = findEvents(countryName, monthName, filters.country, filters.year);
    const galleryPromise = generateInspirationGallery(query, filters.type);

    const [eventsResult, galleryResult] = await Promise.allSettled([eventsPromise, galleryPromise]);

    // Handle events result
    if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value.events);
        setSources(eventsResult.value.sources);
    } else {
        setError(eventsResult.reason instanceof Error ? eventsResult.reason.message : 'An unknown error occurred while fetching events.');
    }
    setIsSearchingEvents(false);

    // Handle gallery result
    if (galleryResult.status === 'fulfilled') {
        setInspirationImages(galleryResult.value);
    } else {
        setGalleryError(galleryResult.reason instanceof Error ? galleryResult.reason.message : 'An unknown error occurred while generating images.');
    }
    setIsGeneratingGallery(false);

  }, []);

  const TabButton: React.FC<{view: View, label: string, icon: React.ReactNode}> = ({ view, label, icon }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300 transform border ${
        currentView === view
          ? 'bg-cyan-400/10 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,246,255,0.4)] scale-105'
          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/70 hover:border-slate-500 hover:scale-105'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen text-gray-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-10">
           <h1 className="text-4xl sm:text-6xl font-black tracking-tight gradient-text">
              AI Content Engine
           </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            From local events to global trends, discover your next bestselling idea and visualize it instantly with AI.
          </p>
        </header>

        <div className="flex justify-center mb-8 gap-2 sm:gap-4 flex-wrap">
           <TabButton view="events" label="Event Finder" icon={<SparklesIcon className="w-5 h-5"/>} />
           <TabButton view="trends" label="Trend Explorer" icon={<ChartBarIcon className="w-5 h-5" />} />
           <TabButton view="market" label="Market Pulse" icon={<GlobeAltIcon className="w-5 h-5" />} />
           <TabButton view="metadata" label="Title & Keywords" icon={<TagIcon className="w-5 h-5" />} />
        </div>

        {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 mb-8 rounded-md animate-fade-in" role="alert">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
            </div>
        )}
        
        <div className="animate-fade-in">
            {currentView === 'events' && (
                <>
                    <FilterBar onSearch={handleSearch} isLoading={isSearchingEvents || isGeneratingGallery} />
                    {hasSearched && (
                        <InspirationGallery 
                            images={inspirationImages} 
                            isLoading={isGeneratingGallery} 
                            error={galleryError}
                            query={searchQuery}
                            contentType={contentType}
                        />
                    )}
                    <EventGrid
                        events={events}
                        isLoading={isSearchingEvents}
                        hasSearched={hasSearched}
                        contentType={contentType}
                        sources={sources}
                    />
                </>
            )}

            {currentView === 'trends' && (
                <TrendExplorer />
            )}

            {currentView === 'market' && (
                <MarketPulse />
            )}

            {currentView === 'metadata' && (
                <MetadataGenerator />
            )}
        </div>
        
        <footer className="text-center mt-16 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Content Engine. Powered by Generative AI.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;