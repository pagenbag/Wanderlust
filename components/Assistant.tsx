import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini, analyzeImageWithGemini } from '../services/gemini';
import { ChatMessage } from '../types';

interface AssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const Assistant: React.FC<AssistantProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'vision'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I can help you refine your travel plans or answer questions about destinations.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vision state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [visionResult, setVisionResult] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await chatWithGemini(messages.slice(-5), input);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setVisionResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    const base64Data = selectedImage.split(',')[1];
    
    try {
      const result = await analyzeImageWithGemini(base64Data, visionPrompt);
      setVisionResult(result);
    } catch (e) {
      setVisionResult("Failed to analyze image.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm print:hidden">
      <div className="w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-700">
        {/* Header */}
        <div className="p-4 bg-slate-950 flex justify-between items-center shadow-md border-b border-slate-800">
          <div className="flex gap-4">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`pb-1 px-2 border-b-2 transition ${activeTab === 'chat' ? 'border-indigo-500 font-bold text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                Chat
            </button>
            <button 
                onClick={() => setActiveTab('vision')}
                className={`pb-1 px-2 border-b-2 transition ${activeTab === 'vision' ? 'border-indigo-500 font-bold text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                Image Analysis
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-800 p-1 rounded-full transition">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden bg-slate-900 relative">
          
          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 shadow-sm border border-slate-700 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-700">
                             <span className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                             </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask about travel..."
                    className="flex-grow px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  />
                  <button 
                    onClick={handleSendChat}
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    <span className="material-icons-outlined text-sm">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISION TAB */}
          {activeTab === 'vision' && (
            <div className="flex flex-col h-full p-6 overflow-y-auto">
                <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 text-center mb-6 border-dashed">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden" 
                        id="img-upload" 
                    />
                    <label 
                        htmlFor="img-upload"
                        className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-400 transition"
                    >
                        {selectedImage ? (
                            <img src={selectedImage} alt="Preview" className="max-h-64 rounded-lg object-contain bg-black" />
                        ) : (
                            <>
                                <span className="material-icons-outlined text-4xl">add_photo_alternate</span>
                                <span className="font-medium">Upload a photo</span>
                            </>
                        )}
                    </label>
                </div>

                <div className="space-y-4">
                     <textarea 
                        value={visionPrompt}
                        onChange={(e) => setVisionPrompt(e.target.value)}
                        placeholder="What do you want to know about this image?"
                        className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
                        rows={3}
                     />
                     <button
                        onClick={handleAnalyzeImage}
                        disabled={!selectedImage || isLoading}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                     >
                        {isLoading ? (
                             <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-icons-outlined">search</span>
                        )}
                        Analyze Image
                     </button>
                </div>

                {visionResult && (
                    <div className="mt-6 p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/20">
                        <h4 className="font-bold text-indigo-300 mb-2 flex items-center gap-2">
                            <span className="material-icons-outlined">auto_awesome</span> 
                            Analysis Result
                        </h4>
                        <p className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap">{visionResult}</p>
                    </div>
                )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Assistant;
