
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ContentCard } from './components/ContentCard';
import { GlassCard } from './components/GlassCard';
import { 
  ViewType, 
  ContentItem, 
  HookType, 
  ToneType, 
  Platform 
} from './types';
import { 
  Search, 
  Filter, 
  Plus, 
  Sparkles,
  Zap,
  Copy,
  LayoutGrid,
  AlertCircle,
  RefreshCw,
  Bookmark,
  Settings,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { generateHooks } from './services/gemini';

// Configuración n8n MCP
const N8N_MCP_URL = 'https://n8n.kubyka.com/mcp-server/http';
const N8N_BEARER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZmNmN2VkYy0zYWJmLTRhZWYtOWIzYS00ZTdjOTJjOWE3MGIiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjE3ODM3ODQ1LTU0OTItNGJhZC1iNTc4LTA2ODY3ZTk2MThjOSIsImlhdCI6MTc2NjY4OTk1MX0.TM8MLDhRIQAUYj6sKJS23bGxIkNYP7sqJECC3awlCWg';
const WORKFLOW_NAME = 'Reddit News Scraper v3';

// Mock Initial Data
const MOCK_ITEMS: ContentItem[] = [
  {
    id: '1',
    source: 'reddit',
    source_url: 'https://reddit.com/r/saas/comments/1',
    title: 'How we reached $10k MRR in 6 months with zero ad spend',
    content: 'Our strategy was entirely based on content distribution on niche communities like Reddit and Indie Hackers. We focused on value-first posts that didn\'t look like ads...',
    tags: ['saas', 'marketing', 'growth'],
    scraped_at: new Date().toISOString(),
    metadata: { author: 'startup_guy' }
  },
  {
    id: '2',
    source: 'newsletter',
    source_url: 'https://newsletter.com/growth/102',
    title: 'The Psychology of High-Converting Landing Pages',
    content: 'Understanding cognitive biases is the key to conversion. From the scarcity principle to social proof, here are the 7 triggers you should be using...',
    tags: ['ux', 'psychology', 'conversion'],
    scraped_at: new Date().toISOString(),
    metadata: { publication: 'Growth Bytes' }
  }
];

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('feed');
  const [items, setItems] = useState<ContentItem[]>(MOCK_ITEMS);
  const [isScraping, setIsScraping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'reddit' | 'newsletter'>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [selectedItemForHook, setSelectedItemForHook] = useState<ContentItem | null>(null);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [generatedHooksList, setGeneratedHooksList] = useState<string[]>([]);
  const [hookConfig, setHookConfig] = useState({
    type: HookType.STORY,
    tone: ToneType.PROFESSIONAL,
    platform: Platform.LINKEDIN
  });

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === 'all' || item.source === filterSource;
    const matchesView = activeView === 'saved' ? item.is_saved : true;
    return matchesSearch && matchesSource && matchesView;
  });

  const handleScrape = async () => {
    setIsScraping(true);
    addToast(`Conectando con n8n MCP: ${WORKFLOW_NAME}...`, 'success');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(N8N_MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${N8N_BEARER}`,
          'Accept': 'application/json'
        },
        mode: 'cors', // Crucial para peticiones cross-origin
        signal: controller.signal,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: WORKFLOW_NAME,
            arguments: {}
          },
          id: Date.now()
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Error de Autenticación. Revisa el Token Bearer.');
        }
        if (response.status === 404) {
          throw new Error('Endpoint MCP no encontrado (404). Verifica la URL.');
        }
        const text = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${text.substring(0, 50)}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`MCP Tool Error: ${data.error.message || 'Error en el workflow'}`);
      }

      // Si el workflow devuelve datos directamente en el result
      const toolResult = data.result?.content?.[0]?.text;
      
      addToast('Scraping finalizado con éxito', 'success');
      
      const newItem: ContentItem = {
        id: Math.random().toString(36).substr(2, 9),
        source: 'reddit',
        source_url: '#',
        title: `Nuevos hilos: ${new Date().toLocaleTimeString()}`,
        content: toolResult || 'El workflow de n8n se ejecutó correctamente y los datos han sido actualizados en la base de datos.',
        tags: ['mcp', 'reddit', 'curated'],
        scraped_at: new Date().toISOString(),
        metadata: { workflow: WORKFLOW_NAME }
      };
      
      setItems(prev => [newItem, ...prev]);
      setActiveView('feed');

    } catch (error: any) {
      console.error('Detalles del error MCP:', error);
      
      let errorMsg = error.message;
      if (error.name === 'AbortError') errorMsg = 'La petición tardó demasiado (Timeout)';
      if (errorMsg === 'Failed to fetch') errorMsg = 'Error de Red / CORS. Asegúrate que n8n permite peticiones externas.';
      
      addToast(`Fallo en Scrape: ${errorMsg}`, 'error');
    } finally {
      setIsScraping(false);
    }
  };

  const toggleSave = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, is_saved: !item.is_saved } : item
      );
      const target = updated.find(i => i.id === id);
      if (target) {
        addToast(target.is_saved ? 'Guardado en librería' : 'Eliminado de guardados', 'success');
      }
      return updated;
    });
  };

  const handleStartGenerateHook = (item: ContentItem) => {
    setSelectedItemForHook(item);
    setActiveView('hooks');
    setGeneratedHooksList([]);
    addToast('Contenido cargado en generador', 'success');
  };

  const executeGenerateHooks = async () => {
    if (!selectedItemForHook) return;
    setGeneratingHooks(true);
    try {
      const results = await generateHooks(
        selectedItemForHook.content,
        hookConfig.type,
        hookConfig.tone,
        hookConfig.platform
      );
      setGeneratedHooksList(results);
      addToast('Variaciones listas para usar', 'success');
    } catch (err) {
      addToast('Error de IA: No se pudo generar los ganchos', 'error');
    } finally {
      setGeneratingHooks(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Toast System */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-md">
        {toasts.map(toast => (
          <div key={toast.id} className={`glass px-6 py-4 rounded-2xl flex items-center gap-4 animate-slide-in border ${toast.type === 'success' ? 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="text-green-400 shrink-0" size={20} /> : <XCircle className="text-red-400 shrink-0" size={20} />}
            <span className="text-sm font-medium leading-tight">{toast.message}</span>
          </div>
        ))}
      </div>

      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onScrape={handleScrape}
        isScraping={isScraping}
      />

      <main className="flex-1 md:ml-[260px] p-6 lg:p-10 max-w-[1600px] mx-auto w-full transition-all">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              {activeView === 'feed' && 'Discovery Feed'}
              {activeView === 'saved' && 'Librería de Guardados'}
              {activeView === 'hooks' && 'Hooks Generator'}
              {activeView === 'settings' && 'Configuración'}
            </h1>
            <p className="text-white/40 mt-1">
              {activeView === 'feed' && 'Contenido fresco curado para ti'}
              {activeView === 'saved' && `${filteredItems.length} items guardados estratégicamente`}
              {activeView === 'hooks' && 'Potencia tu contenido con IA de última generación'}
              {activeView === 'settings' && 'Gestiona tus conexiones y fuentes de datos'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium text-green-400">
               <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
               Supabase: OK
             </div>
             <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium text-cyan-400">
               <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
               n8n MCP: ONLINE
             </div>
          </div>
        </header>

        {(activeView === 'feed' || activeView === 'saved') && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 glass px-4 py-3 rounded-2xl flex items-center gap-3 focus-within:border-cyan-500/50 transition-all">
              <Search className="text-white/20" size={20} />
              <input 
                type="text" 
                placeholder="Buscar en el contenido..." 
                className="bg-transparent border-none outline-none w-full text-white/80 placeholder:text-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="glass p-1 rounded-2xl flex">
                {(['all', 'reddit', 'newsletter'] as const).map(source => (
                  <button 
                    key={source}
                    onClick={() => setFilterSource(source)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filterSource === source ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </button>
                ))}
              </div>
              
              <button className="glass p-3 rounded-2xl text-white/40 hover:text-white transition-all">
                <Filter size={20} />
              </button>
            </div>
          </div>
        )}

        {activeView === 'hooks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-4 space-y-6">
              <GlassCard glowColor="purple">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-400" />
                  Configurar Generación
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2 block">Tipo de Hook</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(HookType).map(type => (
                        <button 
                          key={type}
                          onClick={() => setHookConfig(prev => ({ ...prev, type }))}
                          className={`py-2 px-3 rounded-xl border text-sm transition-all ${
                            hookConfig.type === type ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2 block">Tono</label>
                    <div className="flex gap-2">
                      {Object.values(ToneType).map(tone => (
                        <button 
                          key={tone}
                          onClick={() => setHookConfig(prev => ({ ...prev, tone }))}
                          className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all ${
                            hookConfig.tone === tone ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2 block">Plataforma</label>
                    <select 
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-white/60 focus:outline-none focus:border-purple-500/40 transition-all appearance-none"
                      value={hookConfig.platform}
                      onChange={(e) => setHookConfig(prev => ({ ...prev, platform: e.target.value as Platform }))}
                    >
                      {Object.values(Platform).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    disabled={!selectedItemForHook || generatingHooks}
                    onClick={executeGenerateHooks}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all ${
                      !selectedItemForHook || generatingHooks 
                      ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white accent-glow-purple shadow-lg shadow-purple-500/20'
                    }`}
                  >
                    {generatingHooks ? (
                      <>
                        <RefreshCw className="animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Zap />
                        Generar Hooks
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>

              {selectedItemForHook && (
                <GlassCard className="opacity-80">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 block">Fuente Base</h3>
                  <h4 className="font-semibold text-sm mb-2">{selectedItemForHook.title}</h4>
                  <p className="text-xs text-white/40 line-clamp-4">{selectedItemForHook.content}</p>
                </GlassCard>
              )}
            </div>

            <div className="lg:col-span-8">
              {generatedHooksList.length > 0 ? (
                <div className="space-y-4">
                  {generatedHooksList.map((hook, idx) => (
                    <GlassCard key={idx} className="relative group hover:border-purple-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] uppercase font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
                          Opción {idx + 1}
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(hook);
                            addToast('Copiado al portapapeles', 'success');
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <p className="text-lg text-white/90 leading-relaxed font-medium">
                        {hook}
                      </p>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass rounded-[32px] p-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Sparkles size={40} className="text-white/20" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Transformación AI</h3>
                  <p className="text-white/40 max-w-sm">
                    Selecciona un contenido y presiona generar para ver la magia de Gemini en acción.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : activeView === 'settings' ? (
          <div className="max-w-4xl space-y-8 animate-fade-in">
            <GlassCard>
              <h2 className="text-xl font-bold mb-6">Ecosistema Técnico</h2>
              <div className="space-y-4">
                {[
                  { name: 'Supabase DB', status: 'Connected', icon: '⚡', color: 'text-green-400' },
                  { name: 'n8n Cloud', status: 'Connected', icon: '🤖', color: 'text-green-400' },
                  { name: WORKFLOW_NAME, status: 'Active (MCP Bridge)', icon: '👽', color: 'text-cyan-400' }
                ].map(conn => (
                  <div key={conn.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">{conn.icon}</div>
                      <div>
                        <h4 className="font-semibold">{conn.name}</h4>
                        <p className={`text-xs font-medium ${conn.color}`}>{conn.status}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white hover:border-white/20 transition-all">
                      Diagnostics
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  onSave={toggleSave} 
                  onGenerateHook={handleStartGenerateHook}
                />
              ))
            ) : (
              <div className="col-span-full h-96 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} className="text-white/10" />
                </div>
                <h3 className="text-xl font-bold text-white/80">Vacío</h3>
                <p className="text-white/40 mt-2 max-w-sm">
                  Activa el scraping para traer contenido fresco mediante n8n.
                </p>
                <button 
                  onClick={handleScrape}
                  disabled={isScraping}
                  className="mt-8 px-8 py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-all font-semibold disabled:opacity-50"
                >
                  Scrape Ahora
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 glass-dark border-t border-white/5 z-50 flex items-center justify-around px-6">
        <button onClick={() => setActiveView('feed')} className={`p-2 transition-all ${activeView === 'feed' ? 'text-cyan-400 scale-125' : 'text-white/40'}`}>
          <LayoutGrid size={24} />
        </button>
        <button onClick={() => setActiveView('saved')} className={`p-2 transition-all ${activeView === 'saved' ? 'text-cyan-400 scale-125' : 'text-white/40'}`}>
          <Bookmark size={24} />
        </button>
        <button 
          onClick={handleScrape} 
          disabled={isScraping}
          className="w-14 h-14 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg -translate-y-6 accent-glow-cyan"
        >
          <RefreshCw size={24} className={isScraping ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => setActiveView('hooks')} className={`p-2 transition-all ${activeView === 'hooks' ? 'text-cyan-400 scale-125' : 'text-white/40'}`}>
          <Zap size={24} />
        </button>
        <button onClick={() => setActiveView('settings')} className={`p-2 transition-all ${activeView === 'settings' ? 'text-cyan-400 scale-125' : 'text-white/40'}`}>
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
};

export default App;
