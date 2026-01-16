import React, { useState } from 'react';
import { UserPreferences } from '../types';

interface FormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const INTERESTS_OPTIONS = [
  "Cultural", "Food", "Architecture", "History", 
  "Nature", "Adventure", "Relaxation", "Nightlife", "Shopping", "Art"
];

const Form: React.FC<FormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserPreferences>({
    destination: '',
    duration: 3,
    travelers: 2,
    hasChildren: false,
    interests: [],
  });

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.destination && formData.interests.length > 0) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-700">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Plan Your Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Destination & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Destination</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="e.g., Kyoto, Japan"
              value={formData.destination}
              onChange={e => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Duration (Days)</label>
            <input
              type="number"
              min="1"
              max="14"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Travelers & Kids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Travelers</label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={formData.travelers}
              onChange={e => setFormData({ ...formData, travelers: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="flex items-center pt-8">
            <input
              type="checkbox"
              id="children"
              className="w-5 h-5 text-indigo-500 rounded bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
              checked={formData.hasChildren}
              onChange={e => setFormData({ ...formData, hasChildren: e.target.checked })}
            />
            <label htmlFor="children" className="ml-3 text-sm font-medium text-slate-300 cursor-pointer">
              Traveling with children?
            </label>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">Interests (Select at least one)</label>
          <div className="flex flex-wrap gap-3">
            {INTERESTS_OPTIONS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  formData.interests.includes(interest)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || formData.interests.length === 0 || !formData.destination}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
            isLoading 
              ? 'bg-indigo-900/50 text-indigo-200 cursor-not-allowed border border-indigo-900' 
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/25'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/30 border-t-white"></span>
              Crafting Itinerary...
            </span>
          ) : (
            'Generate Itinerary'
          )}
        </button>
      </form>
    </div>
  );
};

export default Form;
