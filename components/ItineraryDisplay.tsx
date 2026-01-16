import React, { useState, useRef } from 'react';
import { Itinerary, Accommodation, Activity, DayPlan } from '../types';
import ActivityCard from './ActivityCard';
import LeafletMap from './LeafletMap';

// Declare html2pdf for TypeScript since it's loaded via CDN
declare const html2pdf: any;

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  onSuggestAlternative: (dayIndex: number, activityId: string) => void;
  onSuggestAccommodation: (dayIndex: number, accommodation: Accommodation) => void;
  loadingId: string | null;
  onUpdateItinerary: (updated: Itinerary) => void;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ 
    itinerary, onSuggestAlternative, onSuggestAccommodation, loadingId, onUpdateItinerary
}) => {
  const [expandedDays, setExpandedDays] = useState<number[]>([0]); 
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const toggleDay = (index: number) => {
    setExpandedDays(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const getPhotosLink = (name: string, location: string) =>
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + ' ' + location)}`;

  // --- Handlers for Editing ---

  const handleSaveDay = (dayIndex: number) => {
      setEditingDayIndex(null);
  };

  const handleUpdateDay = (dayIndex: number, updatedDay: DayPlan) => {
      const newDays = [...itinerary.days];
      newDays[dayIndex] = updatedDay;
      onUpdateItinerary({ ...itinerary, days: newDays });
  };

  const handleUpdateActivity = (dayIndex: number, activityId: string, updatedAct: Activity) => {
      const day = itinerary.days[dayIndex];
      const newActs = day.activities.map(a => a.id === activityId ? updatedAct : a);
      handleUpdateDay(dayIndex, { ...day, activities: newActs });
  };

  const handleUpdateAccommodation = (dayIndex: number, updatedAcc: Accommodation) => {
      const day = itinerary.days[dayIndex];
      handleUpdateDay(dayIndex, { ...day, accommodation: updatedAcc });
  };

  const handleUpdateSummary = (dayIndex: number, newSummary: string) => {
      const day = itinerary.days[dayIndex];
      handleUpdateDay(dayIndex, { ...day, summary: newSummary });
  };

  // --- Map Data Helper ---
  const getAllMapLocations = () => {
      let locations: any[] = [];
      itinerary.days.forEach(day => {
          if (day.accommodation.coordinates) {
              locations.push({ 
                  ...day.accommodation.coordinates, 
                  title: day.accommodation.name, 
                  type: 'accommodation',
                  day: day.dayNumber
              });
          }
          day.activities.forEach(act => {
              if (act.coordinates && act.type !== 'travel') {
                  locations.push({ 
                      ...act.coordinates, 
                      title: act.name, 
                      type: act.type === 'meal' ? 'meal' : 'activity',
                      day: day.dayNumber,
                      time: act.time
                  });
              }
          });
      });
      return locations;
  };

  // --- PDF Export ---
  const handleExportPDF = async () => {
    // 1. Enter export mode (expands all days)
    setIsExporting(true);
    
    // Wait for state update and DOM render
    setTimeout(() => {
        const element = document.getElementById('itinerary-content');
        const opt = {
          margin: 0.25,
          filename: `Travel_Itinerary_${itinerary.destination.replace(/\s/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: true }, // useCORS attempts to capture external images
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false); // Reset after save
        });
    }, 500);
  };

  return (
    <div className="space-y-8">
      {/* Trip Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden bg-slate-900 rounded-3xl text-white shadow-2xl border border-slate-700">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900/50 z-0"></div>
            <div className="relative z-10 p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{itinerary.destination}</h1>
                    <div className="flex gap-2 print:hidden">
                        <button 
                            onClick={() => setIsMapOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            <span className="material-icons-outlined">map</span>
                            View Map
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                            {isExporting ? (
                                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <span className="material-icons-outlined">picture_as_pdf</span>
                            )}
                            Export PDF
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-indigo-200 mt-4">
                    <span className="flex items-center gap-2">
                        <span className="material-icons-outlined">calendar_today</span>
                        {itinerary.duration} Days
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="material-icons-outlined">people</span>
                        {itinerary.travelers} Travelers
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="material-icons-outlined">child_care</span>
                        {itinerary.hasChildren ? 'Family Friendly' : 'Adults Only'}
                    </span>
                </div>
                <div className="flex gap-2 mt-6 flex-wrap">
                    {itinerary.interests.map(i => (
                        <span key={i} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm backdrop-blur-sm text-white">
                            {i}
                        </span>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Map Modal */}
      {isMapOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in print:hidden">
              <div className="w-full max-w-6xl h-[80vh] bg-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
                  <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-slate-700">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span className="material-icons-outlined text-indigo-500">map</span> 
                          Trip Map
                      </h3>
                      <button onClick={() => setIsMapOpen(false)} className="text-slate-400 hover:text-white">
                          <span className="material-icons-outlined">close</span>
                      </button>
                  </div>
                  <div className="flex-grow relative overflow-hidden">
                      <LeafletMap locations={getAllMapLocations()} days={itinerary.duration} />
                  </div>
              </div>
          </div>
      )}

      {/* Content for PDF Generation */}
      <div id="itinerary-content" className="space-y-6 bg-slate-950 p-2">
        {/* Render Map for PDF Export Only */}
        {isExporting && (
             <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-700">
                 <h2 className="text-2xl font-bold text-white mb-4">Route Map</h2>
                 <div className="h-[400px] w-full rounded-lg overflow-hidden relative">
                     {/* Note: Leaflet maps might struggle to render in html2pdf depending on CORS, 
                         but we render it here to attempt capture. 
                         If CORS fails for tiles, markers usually still show on a blank bg. */}
                     <LeafletMap locations={getAllMapLocations()} days={itinerary.duration} />
                 </div>
             </div>
        )}

        {itinerary.days.map((day, dayIndex) => {
           // If exporting, force expand all days. Otherwise use state.
           const isExpanded = isExporting ? true : expandedDays.includes(dayIndex);
           const isEditing = editingDayIndex === dayIndex;
           
           return (
            <div key={dayIndex} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all break-inside-avoid mb-6">
                {/* Day Header */}
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex items-center gap-4 cursor-pointer flex-grow" onClick={() => !isExporting && toggleDay(dayIndex)}>
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                            {day.dayNumber}
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-white">Day {day.dayNumber}</h2>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={day.summary}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleUpdateSummary(dayIndex, e.target.value)}
                                    className="w-full mt-1 p-1 bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm"
                                />
                            ) : (
                                <p className="text-slate-400 text-sm mt-0.5">{day.summary}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        {!isEditing && !isExporting ? (
                             <button 
                                onClick={() => setEditingDayIndex(dayIndex)}
                                className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1 print:hidden"
                             >
                                <span className="material-icons-outlined text-sm">edit</span>
                                Edit Day
                             </button>
                        ) : isEditing ? (
                             <button 
                                onClick={() => handleSaveDay(dayIndex)}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 print:hidden"
                             >
                                <span className="material-icons-outlined text-sm">check</span>
                                Done
                             </button>
                        ) : null}

                        <div className="flex gap-4 text-xs font-mono text-slate-400 border-l border-slate-700 pl-4">
                            <div className="flex flex-col items-end">
                                <span className="uppercase tracking-wider text-[10px] text-slate-500">Cost</span>
                                <span className="text-white">{day.stats.totalCost}</span>
                            </div>
                            <div className="w-px bg-slate-700"></div>
                            <div className="flex flex-col items-end">
                                <span className="uppercase tracking-wider text-[10px] text-slate-500">Travel</span>
                                <span className="text-white">{day.stats.totalTravelTime}</span>
                            </div>
                        </div>
                        {!isExporting && (
                            <button onClick={() => toggleDay(dayIndex)} className="print:hidden">
                                <span className={`material-icons-outlined text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Collapsible Content */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pt-0 border-t border-slate-700/50">
                        
                        {/* Accommodation */}
                        <div className="mt-6 mb-8 p-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/20">
                            <div className="bg-slate-900/90 rounded-xl p-4 flex flex-col md:flex-row gap-6 items-start">
                                <div className="relative group/acc-img flex-shrink-0 w-full md:w-32 h-32">
                                    <img src={day.accommodation.imageUrl} alt={day.accommodation.name} className="w-full h-full rounded-lg object-cover bg-slate-800" crossOrigin="anonymous" />
                                    <a 
                                        href={getPhotosLink(day.accommodation.name, day.accommodation.location)}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/acc-img:opacity-100 transition-opacity rounded-lg print:hidden"
                                    >
                                        <span className="material-icons-outlined text-white">image</span>
                                    </a>
                                </div>
                                <div className="flex-grow w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-icons-outlined text-indigo-400">hotel</span>
                                        {isEditing ? (
                                            <input 
                                                value={day.accommodation.name}
                                                onChange={(e) => handleUpdateAccommodation(dayIndex, {...day.accommodation, name: e.target.value})}
                                                className="bg-slate-800 border border-slate-600 rounded p-1 text-indigo-100 font-bold w-full md:w-1/2"
                                            />
                                        ) : (
                                            <h3 className="font-bold text-indigo-100">{day.accommodation.name}</h3>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <textarea 
                                            value={day.accommodation.description}
                                            onChange={(e) => handleUpdateAccommodation(dayIndex, {...day.accommodation, description: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-slate-400 text-sm mb-2"
                                        />
                                    ) : (
                                        <p className="text-slate-400 text-sm mb-2">{day.accommodation.description}</p>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-indigo-300 flex-wrap">
                                        <span className="font-mono bg-indigo-950/50 px-2 py-1 rounded">{day.accommodation.price}</span>
                                        {day.accommodation.bookingLink && !isExporting && (
                                            <a href={day.accommodation.bookingLink} target="_blank" rel="noreferrer" className="underline hover:text-white flex items-center gap-1 print:hidden">
                                                <span className="material-icons-outlined text-xs">book_online</span>
                                                Book Now
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {!isEditing && !isExporting && (
                                    <button 
                                        onClick={() => onSuggestAccommodation(dayIndex, day.accommodation)}
                                        disabled={loadingId === day.accommodation.id}
                                        className="text-xs text-slate-500 hover:text-white flex items-center gap-1 self-start md:self-center bg-slate-800 px-3 py-1.5 rounded-full transition-colors print:hidden"
                                    >
                                        <span className={`material-icons-outlined text-sm ${loadingId === day.accommodation.id ? 'animate-spin' : ''}`}>autorenew</span>
                                        Alternative
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Activities */}
                        <div className="space-y-6 pl-2">
                             {day.activities.map((activity) => (
                                <ActivityCard 
                                    key={activity.id} 
                                    activity={activity} 
                                    onSuggestAlternative={() => onSuggestAlternative(dayIndex, activity.id)}
                                    isLoadingAlternative={loadingId === activity.id}
                                    isEditing={isEditing}
                                    onChange={(updated) => handleUpdateActivity(dayIndex, activity.id, updated)}
                                />
                             ))}
                        </div>
                    </div>
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default ItineraryDisplay;