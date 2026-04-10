import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useDebounce } from '../hooks/useDebounce';
import { ArrowLeft, Save, EyeOff, Eye, Palette, CheckCircle2 } from 'lucide-react';

export default function Notebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hideNotes, setHideNotes] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  // Note State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clues, setClues] = useState('');
  const [summary, setSummary] = useState('');
  const [theme, setTheme] = useState('paper');
  const [customColor, setCustomColor] = useState('#fdfcf0');

  // Debounced Values for Auto-save
  const debouncedContent = useDebounce(content, 2000);
  const debouncedClues = useDebounce(clues, 2000);
  const debouncedSummary = useDebounce(summary, 2000);
  const debouncedTitle = useDebounce(title, 2000);

  // Track initial load to prevent immediate save
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function fetchNote() {
      if (!currentUser || !id) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'notes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setContent(data.content || '');
          setClues(data.clues || '');
          setSummary(data.summary || '');
          setTheme(data.theme || 'paper');
          if (data.theme && data.theme.startsWith('#')) {
            setCustomColor(data.theme);
            setTheme('custom');
          }
        } else {
          navigate('/dashboard'); // Note not found
        }
      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNote();
  }, [id, currentUser, navigate]);


  // Auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    async function saveNote() {
      if (!currentUser || !id) return;
      setSaving(true);
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'notes', id);
        await updateDoc(docRef, {
          title: debouncedTitle,
          content: debouncedContent,
          clues: debouncedClues,
          summary: debouncedSummary,
          theme: theme === 'custom' ? customColor : theme,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving note:", error);
      } finally {
        // Add a tiny delay to show the "Saved" state briefly
        setTimeout(() => setSaving(false), 800);
      }
    }

    // Only fire save if we aren't loading
    if (!loading) {
       saveNote();
    }
  }, [debouncedContent, debouncedClues, debouncedSummary, debouncedTitle, theme, customColor]);


  if (loading) {
     return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Theme Styling Logic
  let containerStyle = {};
  let containerClass = "flex-1 w-full mx-auto max-w-5xl shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-3 ";
  
  if (theme === 'paper') {
    containerClass += " paper-theme border-x border-slate-200 min-h-screen";
  } else if (theme === 'white') {
    containerClass += " bg-white border-x border-slate-200 min-h-screen";
  } else if (theme === 'custom') {
    containerStyle = { backgroundColor: customColor };
    containerClass += " border-x border-slate-200 min-h-screen";
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setShowThemeMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Toolbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="font-semibold text-lg text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full max-w-md placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            
            {/* Save indicator */}
            <div className="flex items-center text-sm text-slate-500 mr-2">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-500 mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                  Saved
                </>
              )}
            </div>

            {/* Hide Notes Toggle */}
            <button
              onClick={() => setHideNotes(!hideNotes)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                hideNotes 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {hideNotes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {hideNotes ? 'Show Notes' : 'Hide Notes'}
            </button>

            {/* Theme Picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                title="Theme"
              >
                <Palette className="w-5 h-5" />
              </button>
              
              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Themes</p>
                  </div>
                  <button onClick={() => handleThemeChange('paper')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                    Paper (Lined)
                    {theme === 'paper' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>
                  <button onClick={() => handleThemeChange('white')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                    Clean White
                    {theme === 'white' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>
                  <div className="px-4 py-3 border-t border-slate-100">
                    <label className="text-xs font-medium text-slate-600 block mb-2">Custom Color</label>
                    <div className="flex items-center gap-2">
                       <input 
                        type="color" 
                        value={customColor}
                        onChange={(e) => { 
                          setCustomColor(e.target.value); 
                          setTheme('custom');
                        }}
                        className="h-8 w-full p-0 border-0 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Notebook Area - Cornell Notes Layout */}
      <div className="flex-1 w-full overflow-y-auto pb-20 relative">
        <div style={containerStyle} className={containerClass}>
          
          {/* Left Column: Clues (1/3) */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-400/40 p-6 min-h-[300px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Clues</h3>
            <textarea
              value={clues}
              onChange={(e) => setClues(e.target.value)}
              placeholder="Questions, main ideas, vocabulary..."
               className="w-full h-[calc(100%-2rem)] bg-transparent resize-none focus:outline-none text-slate-800 leading-10 placeholder-slate-400/50"
              style={{ lineHeight: theme === 'paper' ? '2.5rem' : '1.5rem' }}
            />
          </div>

          {/* Right Column: Notes (2/3) */}
          <div className={`md:col-span-2 p-6 min-h-[500px] transition-all duration-300 ${hideNotes ? 'blur-md opacity-60 select-none' : ''}`}>
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Take your main notes here..."
              className="w-full h-[calc(100%-2rem)] bg-transparent resize-none focus:outline-none text-slate-800 leading-10 placeholder-slate-400/50"
              style={{ lineHeight: theme === 'paper' ? '2.5rem' : '1.5rem' }}
            />
          </div>

          {/* Bottom Row: Summary (Full width spanning all cols) */}
          <div className="md:col-span-3 border-t-2 border-slate-400/50 p-6 min-h-[250px]">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Summary</h3>
             <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summarize the core concepts..."
               className="w-full h-[calc(100%-2rem)] bg-transparent resize-none focus:outline-none text-slate-800 leading-10 placeholder-slate-400/50 font-medium"
              style={{ lineHeight: theme === 'paper' ? '2.5rem' : '1.5rem' }}
            />
          </div>

        </div>
      </div>

    </div>
  );
}
