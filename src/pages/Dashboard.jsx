import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import NoteCard from '../components/NoteCard';
import { Plus, LogOut, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const notesRef = collection(db, 'users', currentUser.uid, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateNote = async () => {
    if (isCreating || !currentUser) return;
    setIsCreating(true);

    try {
      const notesRef = collection(db, 'users', currentUser.uid, 'notes');
      const newNoteRef = await addDoc(notesRef, {
        title: '',
        content: '',
        clues: '',
        summary: '',
        theme: 'paper',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      navigate(`/note/${newNoteRef.id}`);
    } catch (error) {
      console.error("Error creating note:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-slate-800">My Notebooks</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              {currentUser?.profile?.name || currentUser?.email || 'Guest'}
            </span>
            <button 
              onClick={() => logout()}
              className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {notes.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No notes</h3>
                <p className="mt-1 text-sm text-slate-500">Get started by creating your first note.</p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateNote}
                    disabled={isCreating}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    {isCreating ? 'Creating...' : 'New Note'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                
                {/* Create Note Card */}
                <button 
                  onClick={handleCreateNote}
                  disabled={isCreating}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center h-48 hover:border-indigo-500 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                >
                  <div className="bg-indigo-100 p-3 rounded-full mb-3 group-hover:bg-indigo-200 transition-colors">
                    <Plus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-indigo-700">
                    {isCreating ? 'Creating...' : 'Create New Note'}
                  </span>
                </button>

                {/* Existing Notes */}
                {notes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
