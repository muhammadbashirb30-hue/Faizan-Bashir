import React from 'react';
import { COUNTRIES, MONTHS, CONTENT_TYPES, YEARS } from '../constants';
import type { ContentType } from '../types';

interface FilterBarProps {
  onSearch: (filters: { country: string; month: number; year: number; type: ContentType }) => void;
  isLoading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, isLoading }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [country, setCountry] = React.useState<string>(COUNTRIES[0].code);
  const [month, setMonth] = React.useState<number>(currentMonth);
  const [year, setYear] = React.useState<number>(currentYear + 1);
  const [type, setType] = React.useState<ContentType>(CONTENT_TYPES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ country, month, year, type });
  };

  return (
    <div className="glassmorphism p-4 sm:p-6 rounded-xl mb-8">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 rounded-md shadow-sm light-input"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md shadow-sm light-input"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            id="year"
            list="year-options"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md shadow-sm light-input"
            placeholder={`e.g., ${currentYear + 1}`}
            min={currentYear}
          />
          <datalist id="year-options">
            {YEARS.map(y => (
              <option key={y} value={y} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
            className="w-full px-3 py-2 rounded-md shadow-sm light-input"
          >
            {CONTENT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30"
        >
          {isLoading ? 'Searching...' : 'Find Events'}
        </button>
      </form>
    </div>
  );
};

export default FilterBar;