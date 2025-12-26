
import React from 'react';
import { 
  Bookmark, 
  ExternalLink, 
  Copy, 
  Zap, 
  Mail, 
  MessageSquare,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ContentItem } from '../types';
import { GlassCard } from './GlassCard';

interface ContentCardProps {
  item: ContentItem;
  onSave: (id: string) => void;
  onGenerateHook: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ 
  item, 
  onSave, 
  onGenerateHook 
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${item.title}\n\n${item.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(item.scraped_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <GlassCard className="group hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${item.source === 'reddit' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {item.source === 'reddit' ? <MessageSquare size={18} /> : <Mail size={18} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
              {item.source}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Clock size={12} />
              {formattedDate}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onSave(item.id)}
            className={`p-2 rounded-lg transition-colors ${item.is_saved ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
          >
            <Bookmark size={18} fill={item.is_saved ? "currentColor" : "none"} />
          </button>
          <a 
            href={item.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-snug">
        {item.title}
      </h3>
      
      <p className="text-white/60 text-sm mb-4 line-clamp-3 leading-relaxed">
        {item.content}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {item.tags.map(tag => (
          <span key={tag} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-white/50">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-white/5">
        <button 
          onClick={() => onGenerateHook(item)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold transition-all"
        >
          <Zap size={14} />
          Generar Hook
        </button>
        <button 
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all min-w-[100px]"
        >
          {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </GlassCard>
  );
};
