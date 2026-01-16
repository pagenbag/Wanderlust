import React, { useState } from 'react';
import Form from './components/Form';
import ItineraryDisplay from './components/ItineraryDisplay';
import Assistant from './components/Assistant';
import AlternativeSelectModal from './components/AlternativeSelectModal';
import { generateItinerary, suggestAlternatives, suggestAccommodationAlternatives } from './services/gemini';
import { Itinerary, UserPreferences, Activity, Accommodation } from './types';

const App: React.FC = () => {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAlternatives, setModalAlternatives] = useState<(Activity | Accommodation)[]>([]);
  const [modalOriginal, setModalOriginal] = useState<Activity | Accommodation | null>(null);
  const [modalType, setModalType] = useState<'activity' | 'accommodation'>('activity');
  const [activeDayIndex, setActiveDayIndex] = useState<number>(-1);


  const handleFormSubmit = async (prefs: UserPreferences) => {
    setLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const result = await generateItinerary(prefs);
      setItinerary(result);
    } catch (err) {
      setError("Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItinerary = (updated: Itinerary) => {
      setItinerary(updated);
  };

  const handleSuggestAlternative = async (dayIndex: number, activityId: string) => {
    if (!itinerary) return;
    const activity = itinerary.days[dayIndex].activities.find(a => a.id === activityId);
    if (!activity) return;

    setLoadingId(activityId);
    try {
      const alternatives = await suggestAlternatives(activity, {
        destination: itinerary.destination,
        duration: itinerary.duration,
        travelers: itinerary.travelers,
        hasChildren: itinerary.hasChildren,
        interests: itinerary.interests
      });
      
      setModalType('activity');
      setModalOriginal(activity);
      setModalAlternatives(alternatives);
      setActiveDayIndex(dayIndex);
      setIsModalOpen(true);
    } catch (e) {
      alert("Could not find alternatives at this time.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSuggestAccommodation = async (dayIndex: number, accommodation: Accommodation) => {
    if(!itinerary) return;

    setLoadingId(accommodation.id);
    try {
        const alternatives = await suggestAccommodationAlternatives(accommodation, {
            destination: itinerary.destination,
            duration: itinerary.duration,
            travelers: itinerary.travelers,
            hasChildren: itinerary.hasChildren,
            interests: itinerary.interests
        });

        setModalType('accommodation');
        setModalOriginal(accommodation);
        setModalAlternatives(alternatives);
        setActiveDayIndex(dayIndex);
        setIsModalOpen(true);
    } catch(e) {
        alert("Could not find accommodation alternatives.");
    } finally {
        setLoadingId(null);
    }
  }

  const handleSelectAlternative = (item: Activity | Accommodation) => {
      if (!itinerary || activeDayIndex === -1) return;

      const newDays = [...itinerary.days];
      
      if (modalType === 'activity') {
          const newActivity = item as Activity;
          const activityId = (modalOriginal as Activity).id;
          newDays[activeDayIndex].activities = newDays[activeDayIndex].activities.map(a => 
            a.id === activityId ? newActivity : a
          );
      } else {
          const newAcc = item as Accommodation;
          newDays[activeDayIndex].accommodation = newAcc;
      }

      setItinerary({ ...itinerary, days: newDays });
      setIsModalOpen(false);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative text-slate-100">
      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 print:hidden shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-indigo-500 text-3xl">flight_takeoff</span>
            <span className="font-bold text-xl text-white tracking-tight">Wanderlust AI</span>
          </div>
          
          <div className="flex items-center gap-3">
             {itinerary && (
                <button 
                  onClick={handlePrint}
                  className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition hidden md:block"
                  title="Print"
                >
                  <span className="material-icons-outlined">print</span>
                </button>
             )}
             <button
               onClick={() => setIsAssistantOpen(true)}
               className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
             >
               <span className="material-icons-outlined text-sm">smart_toy</span>
               Assistant
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!itinerary && !loading && (
             <div className="mt-8 animate-fade-in-up">
                <div className="text-center mb-12">
                     <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Your Perfect Journey, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Designed by AI</span>
                     </h1>
                     <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Tell us where you want to go and what you love. We'll build a complete day-by-day plan with hotels, food, and adventures.
                     </p>
                </div>
                <Form onSubmit={handleFormSubmit} isLoading={loading} />
             </div>
        )}

        {loading && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
                    <span className="material-icons-outlined text-7xl text-indigo-400 mb-6 relative z-10">travel_explore</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Crafting your itinerary...</h2>
                <p className="text-slate-400">Analysing destination, checking travel times, and finding hidden gems.</p>
            </div>
        )}

        {error && (
            <div className="bg-red-900/20 text-red-300 p-6 rounded-2xl border border-red-500/30 text-center mt-8 backdrop-blur-sm">
                <span className="material-icons-outlined text-4xl mb-2 block">error_outline</span>
                {error}
                <br/>
                <button onClick={() => setError(null)} className="text-white bg-red-600/50 hover:bg-red-600 px-6 py-2 rounded-lg mt-4 font-medium transition">Try Again</button>
            </div>
        )}

        {itinerary && (
            <div className="animate-fade-in-up">
                 <button 
                    onClick={() => setItinerary(null)}
                    className="mb-8 text-slate-400 flex items-center gap-2 hover:text-white print:hidden text-sm font-medium transition-colors bg-slate-900/50 px-4 py-2 rounded-full w-fit"
                 >
                    <span className="material-icons-outlined text-sm">arrow_back</span>
                    Plan a new trip
                 </button>
                 <ItineraryDisplay 
                    itinerary={itinerary} 
                    onSuggestAlternative={handleSuggestAlternative}
                    onSuggestAccommodation={handleSuggestAccommodation}
                    loadingId={loadingId}
                    onUpdateItinerary={handleUpdateItinerary}
                 />
            </div>
        )}
      </main>

      {/* Assistant Modal */}
      <Assistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      {/* Alternative Selection Modal */}
      <AlternativeSelectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        originalItem={modalOriginal}
        alternatives={modalAlternatives}
        onSelect={handleSelectAlternative}
        type={modalType}
      />
    
      <style>{`
        @keyframes slide-in-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
             from { opacity: 0; }
             to { opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        
        .custom-icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        @media print {
            .no-print, nav, button, .print\\:hidden { display: none !important; }
            body { background: white; color: black; }
            .bg-slate-900, .bg-slate-950, .bg-slate-800, .bg-slate-800\\/50 { background: white !important; color: black !important; }
            .text-white, .text-slate-100, .text-slate-300, .text-slate-400 { color: black !important; }
            .break-inside-avoid { page-break-inside: avoid; }
            .shadow-xl, .shadow-2xl, .shadow-lg { box-shadow: none !important; }
            .border-slate-700 { border-color: #ddd !important; border-style: solid; }
            h1, h2, h3 { color: black !important; }
            .material-icons-outlined { color: #555 !important; }
        }
      `}</style>
    </div>
  );
};

export default App;