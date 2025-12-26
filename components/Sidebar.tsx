
import React, { useState } from 'react';
import { 
  Rss, 
  Bookmark, 
  Zap, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Layers
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onScrape: () => void;
  isScraping: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  onScrape,
  isScraping
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Rss },
    { id: 'saved', label: 'Guardados', icon: Bookmark },
    { id: 'hooks', label: 'Hooks Generator', icon: Zap },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div 
      className={`fixed left-0 top-0 h-full glass-dark border-r border-white/5 transition-all duration-500 z-50 flex flex-col hidden md:flex ${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Curator
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center mx-auto">
            <Layers className="text-white w-5 h-5" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-4 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                ? 'bg-white/10 text-cyan-400 border border-white/10' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'group-hover:scale-110 transition-transform'}`} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Scrape Button */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={onScrape}
          disabled={isScraping}
          className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all duration-300 ${
            isScraping 
            ? 'bg-white/5 text-white/40 cursor-not-allowed' 
            : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white accent-glow-cyan'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${isScraping ? 'animate-spin' : ''}`} />
          {!isCollapsed && <span>{isScraping ? 'Scraping...' : 'Scrape Ahora'}</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
};
