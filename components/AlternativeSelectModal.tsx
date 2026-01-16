import React from 'react';
import { Activity, Accommodation } from '../types';

interface AlternativeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalItem: Activity | Accommodation | null;
  alternatives: (Activity | Accommodation)[];
  onSelect: (item: Activity | Accommodation) => void;
  type: 'activity' | 'accommodation';
}

const AlternativeSelectModal: React.FC<AlternativeSelectModalProps> = ({ 
  isOpen, onClose, originalItem, alternatives, onSelect, type 
}) => {
  if (!isOpen || !originalItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-white">Select Alternative</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Original Card */}
          <div className="flex flex-col border-2 border-indigo-500/30 bg-indigo-900/10 rounded-xl overflow-hidden relative">
            <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">CURRENT</div>
            <div className="h-32 bg-slate-800">
               <img src={originalItem.imageUrl} className="w-full h-full object-cover" alt={originalItem.name} />
            </div>
            <div className="p-4 flex-grow">
                <h4 className="font-bold text-white mb-1">{originalItem.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-3">{originalItem.description}</p>
                <div className="mt-2 text-xs text-slate-300 font-mono">{originalItem.price}</div>
            </div>
            <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                 <button 
                    onClick={onClose}
                    className="w-full py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
                 >
                    Keep This
                 </button>
            </div>
          </div>

          {/* Alternatives */}
          {alternatives.map((alt) => (
            <div key={alt.id} className="flex flex-col border border-slate-700 bg-slate-800 rounded-xl overflow-hidden hover:border-slate-500 transition-colors">
                <div className="h-32 bg-slate-700">
                     <img src={alt.imageUrl} className="w-full h-full object-cover" alt={alt.name} />
                </div>
                <div className="p-4 flex-grow">
                    <h4 className="font-bold text-white mb-1">{alt.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-3">{alt.description}</p>
                    <div className="mt-2 text-xs text-slate-300 font-mono">{alt.price}</div>
                </div>
                <div className="p-3 bg-slate-900 border-t border-slate-700">
                    <button 
                        onClick={() => onSelect(alt)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
                    >
                        Select
                    </button>
                </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AlternativeSelectModal;
