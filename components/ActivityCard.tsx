import React, { useState } from 'react';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onSuggestAlternative: () => void;
  isLoadingAlternative: boolean;
  isEditing: boolean;
  onChange: (updated: Activity) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
    activity, onSuggestAlternative, isLoadingAlternative, isEditing, onChange 
}) => {
  const [imgError, setImgError] = useState(false);
  const isTravel = activity.type === 'travel';

  const handleChange = (field: keyof Activity, value: any) => {
      onChange({ ...activity, [field]: value });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'meal': return 'restaurant';
      case 'travel': return 'directions_transit';
      case 'accommodation': return 'hotel';
      default: return 'photo_camera';
    }
  };

  const getMapLink = (location: string) => 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  const getPhotosLink = (name: string, location: string) =>
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name + ' ' + location)}`;

  // EDIT MODE
  if (isEditing) {
      return (
        <div className="flex gap-4 p-4 bg-slate-800/50 rounded-xl border border-indigo-500/50 mb-4">
             <div className="flex-grow space-y-3">
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={activity.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                        className="w-1/3 p-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                        placeholder="Time"
                     />
                     <input 
                        type="text" 
                        value={activity.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-2/3 p-2 bg-slate-900 border border-slate-600 rounded text-white font-bold"
                        placeholder="Activity Name"
                     />
                 </div>
                 <textarea 
                    value={activity.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                    rows={2}
                    placeholder="Description"
                 />
                 <div className="grid grid-cols-2 gap-2">
                     <input 
                        type="text" 
                        value={activity.price || ''}
                        onChange={(e) => handleChange('price', e.target.value)}
                        className="p-2 bg-slate-900 border border-slate-600 rounded text-white text-xs"
                        placeholder="Price"
                     />
                     <input 
                        type="text" 
                        value={activity.duration || ''}
                        onChange={(e) => handleChange('duration', e.target.value)}
                        className="p-2 bg-slate-900 border border-slate-600 rounded text-white text-xs"
                        placeholder="Duration"
                     />
                 </div>
             </div>
        </div>
      );
  }

  // VIEW MODE
  if (isTravel) {
    return (
        <div className="flex gap-4 relative py-2">
             <div className="absolute left-[3.25rem] top-0 bottom-0 w-0.5 bg-slate-700 -z-10"></div>
            
            <div className="flex-shrink-0 w-24 flex flex-col items-center justify-center">
                 <div className="bg-slate-800 p-1.5 rounded-full border border-slate-600 z-10">
                    <span className="material-icons-round text-lg text-slate-400">commute</span>
                 </div>
            </div>
            
            <div className="flex-grow py-2 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-between">
                <div>
                    <span className="text-slate-300 text-sm font-medium">{activity.name}</span>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                </div>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-950/50 px-2 py-1 rounded">
                    {activity.duration}
                </span>
            </div>
        </div>
    );
  }

  return (
    <div className="flex gap-4 relative group">
      <div className="absolute left-[3.25rem] top-0 bottom-0 w-0.5 bg-slate-700 -z-10 group-last:bottom-auto group-last:h-1/2"></div>

      <div className="flex-shrink-0 w-24 flex flex-col items-center pt-2">
        <span className="text-sm font-bold text-indigo-300 mb-2 font-mono">{activity.time.split(' ')[0]}</span>
        <div className="bg-slate-900 p-2 rounded-full border-2 border-indigo-500 z-10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <span className="material-icons-round text-xl text-indigo-400 block">{getIcon(activity.type)}</span>
        </div>
      </div>

      <div className="flex-grow bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
        <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-slate-900 relative group/image">
                {!imgError ? (
                    <img 
                        src={activity.imageUrl} 
                        alt={activity.name} 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <span className="material-icons-outlined text-4xl">broken_image</span>
                    </div>
                )}
                <div className="absolute top-2 left-2">
                     <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded uppercase tracking-wider">
                        {activity.type}
                     </span>
                </div>
                <a 
                    href={getPhotosLink(activity.name, activity.location)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity"
                >
                    <span className="px-3 py-1 bg-white/20 backdrop-blur border border-white/50 text-white rounded-full text-xs font-medium flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">collections</span>
                        See Photos
                    </span>
                </a>
            </div>

            <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-bold text-white leading-tight">{activity.name}</h4>
                        {activity.rating && (
                            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded text-yellow-500">
                                <span className="material-icons-round text-sm">star</span>
                                <span className="text-xs font-bold">{activity.rating}</span>
                            </div>
                        )}
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{activity.description}</p>
                    
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-300 mb-4">
                        <div className="flex items-center gap-2">
                             <span className="material-icons-outlined text-sm text-slate-500">schedule</span>
                             <span>{activity.openingHours || "Hours varies"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="material-icons-outlined text-sm text-slate-500">attach_money</span>
                             <span>{activity.price || "Free"}</span>
                        </div>
                         <div className="flex items-center gap-2">
                             <span className="material-icons-outlined text-sm text-slate-500">confirmation_number</span>
                             {activity.bookingInfo?.startsWith('http') ? (
                                 <a href={activity.bookingInfo} target="_blank" rel="noreferrer" className="underline hover:text-indigo-400 truncate max-w-[100px]">Booking Link</a>
                             ) : (
                                 <span>{activity.bookingInfo || "No info"}</span>
                             )}
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="material-icons-outlined text-sm text-slate-500">hourglass_empty</span>
                             <span>{activity.duration}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-3 mt-2">
                    <div className="flex gap-3">
                        <a 
                            href={getMapLink(activity.location)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium uppercase tracking-wide"
                        >
                            <span className="material-icons-outlined text-sm">map</span>
                            Map
                        </a>
                         <a 
                            href={getPhotosLink(activity.name, activity.location)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium uppercase tracking-wide"
                        >
                            <span className="material-icons-outlined text-sm">image</span>
                            Photos
                        </a>
                    </div>

                    <button
                        onClick={onSuggestAlternative}
                        disabled={isLoadingAlternative}
                        className="text-xs flex items-center gap-1 text-slate-500 hover:text-white transition-colors print:hidden"
                    >
                        <span className={`material-icons-outlined text-sm ${isLoadingAlternative ? 'animate-spin' : ''}`}>autorenew</span>
                        Alternatives
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;