import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock } from 'lucide-react';

export default function NoteCard({ note }) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/note/${note.id}`);
  };

  const formattedDate = note.updatedAt 
    ? formatDistanceToNow(note.updatedAt.toDate(), { addSuffix: true })
    : 'Just now';

  return (
    <div 
      onClick={handleOpen}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-48"
    >
      <div className="flex items-center gap-2 mb-3 text-indigo-600">
        <FileText className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-lg text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
        {note.title || "Untitled Note"}
      </h3>
      
      <div className="mt-auto flex items-center text-xs text-slate-500 gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span>Edited {formattedDate}</span>
      </div>
    </div>
  );
}
