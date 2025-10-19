import React from 'react';
import type { Event, ContentType, GroundingSource } from '../types';
import EventCard from './EventCard';
import Spinner from './Spinner';
import { LinkIcon, SparklesIcon } from './icons';

interface EventGridProps {
  events: Event[];
  isLoading: boolean;
  hasSearched: boolean;
  contentType: ContentType;
  sources: GroundingSource[];
}

const EventGrid: React.FC<EventGridProps> = ({ events, isLoading, hasSearched, contentType, sources }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-400 font-medium animate-pulse">Searching the web for events...</p>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
      return (
        <div className="text-center py-20 glassmorphism rounded-xl">
            <SparklesIcon className="w-12 h-12 text-cyan-400 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-100 mt-4">Welcome to the Event Finder</h2>
            <p className="mt-2 text-slate-400 max-w-md mx-auto">Select a country, month, and content type above to discover upcoming events and generate creative content ideas instantly.</p>
        </div>
      )
  }

  if (events.length === 0) {
    return (
       <div className="text-center py-20 glassmorphism rounded-xl">
            <h2 className="text-2xl font-bold text-slate-100">No Events Found</h2>
            <p className="mt-2 text-slate-400">The AI couldn't find any major events for your selection. Try a different country or month.</p>
        </div>
    );
  }

  return (
    <div className="animate-slide-up-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map(event => (
          <EventCard key={`${event.name}-${event.date}`} event={event} contentType={contentType} />
        ))}
      </div>
      {sources.length > 0 && !isLoading && (
        <div className="mt-12 p-6 glassmorphism rounded-xl">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-gray-400" />
                Information Sources
            </h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {sources.map((source, index) => (
                    <li key={index} className="text-sm">
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-words transition-colors">
                            {source.title || source.uri}
                        </a>
                    </li>
                ))}
            </ul>
            <p className="text-xs text-gray-500 mt-4">
                Event information is provided by Google Search. Content may be subject to copyright.
            </p>
        </div>
      )}
    </div>
  );
};

export default EventGrid;