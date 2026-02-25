import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import MapView, { ActiveTool, LayerVisibility, layerMapping, geoServerUrl } from '@/components/MapView';
import {
  Menu,
  X,
  Layers,
  Navigation,
  LogOut,
  Map,
  Info,
  Plus
} from 'lucide-react';

import { SelectedFeatureData } from '@/components/MapView';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [visibleLayers, setVisibleLayers] = useState<LayerVisibility>({
    water: true, building: true, building_summary: true, roads: true, rail: true, bus: true, fire: true,
  });
  const [openLegendKey, setOpenLegendKey] = useState<string | null>(null);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('cursor');

  // Dashboard-owned feature selection and extras state
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeatureData | null>(null);
  const [featureExtras, setFeatureExtras] = useState<Record<string, { image?: string | null, progress?: string }>>({});

  const handleExtraChange = (id: string, key: 'image' | 'progress', value: any) => {
    setFeatureExtras(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value
      }
    }));
  };

  const toggleLayer = (key: keyof LayerVisibility) => {
    setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex relative bg-slate-950 font-sans">
      {/* Main Content (Map fills entire screen now) */}
      <main className="flex-1 flex flex-col min-h-screen relative w-full h-full">
        {/* Top Header Floating Glass Bar */}
        <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Map className="w-4 h-4 text-blue-400" />
              </div>
              <h1 className="font-bold text-white tracking-wide text-lg">MAP<span className="text-blue-400 font-light">VISION</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest font-semibold">Live Server</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/60 hover:text-red-400 hover:bg-white/5 transition-colors rounded-xl font-medium text-xs px-4"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Floating Layer Control Panel (Glassmorphic) */}
        <aside className="absolute top-24 left-4 z-40 w-72 max-h-[calc(100vh-8rem)] flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-gradient-to-b from-white/5 to-transparent">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2">
                Data Layers
              </h2>
              <p className="text-xs text-slate-400">Toggle geographic views</p>
            </div>
          </div>

          {/* Scrollable Layer List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {(Object.keys(visibleLayers) as Array<keyof LayerVisibility>).map((key, index) => (
              <div
                key={key}
                className="group flex flex-col bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleLayer(key)}>
                  <div className="flex items-center gap-3">
                    {/* Minimal Toggle Dot */}
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${visibleLayers[key] ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-white/20'}`} />
                    <span className={`text-sm font-medium transition-colors ${visibleLayers[key] ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'} capitalize`}>
                      {key.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Info Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenLegendKey(openLegendKey === key ? null : key);
                    }}
                    className={`p-1.5 rounded-full transition-all duration-300 ${openLegendKey === key
                      ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                      : 'text-slate-500 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <Info size={14} className={openLegendKey === key ? 'opacity-100' : 'opacity-70'} />
                  </button>
                </div>

                {/* Smooth Legend Graphic Display */}
                <div className={`overflow-hidden transition-all duration-400 ease-in-out ${openLegendKey === key ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-black/20">
                    <img
                      src={`${geoServerUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layerMapping[key]}&LEGEND_OPTIONS=fontSize:10;fontColor:0xFFFFFF;fontAntiAliasing:true&TRANSPARENT=true`}
                      alt={`${key} legend`}
                      className="max-w-full drop-shadow-md brightness-110"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Map Container and Feature Sidebar wrapper */}
        <div className={`relative flex-1 flex transition-all duration-500 overflow-hidden`}>
          <div className="map-container absolute inset-0 z-0">
            <MapView
              visibleLayers={visibleLayers}
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onFeatureSelect={setSelectedFeature}
              selectedFeature={selectedFeature}
            />

            {/* Corner decoration */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>OpenLayers Map</span>
            </div>
          </div>

          {/* Feature Properties Panel (Glassmorphic) */}
          {selectedFeature && (
            <aside className="absolute right-4 top-24 bottom-4 z-40 w-96 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in slide-in-from-right-8 fade-in-0 duration-500 ease-out">
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div>
                  <h3 className="font-bold text-white tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    Feature Details
                  </h3>
                  <p className="text-xs text-blue-300 mt-1 uppercase tracking-widest font-semibold">{selectedFeature.layerKey.replace('_', ' ')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/20 text-white" onClick={() => setSelectedFeature(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-24">
                <div className="space-y-6">
                  {/* Attributes Table */}
                  <div className="space-y-2 bg-white/5 rounded-2xl p-4 border border-white/5">
                    {Object.entries(selectedFeature.properties).map(([key, value]) => {
                      if (key === 'bbox' || key.startsWith('geom')) return null;
                      return (
                        <div key={key} className="flex flex-col gap-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-white font-mono break-words">
                            {typeof value === 'number' ? (value > 1000 ? value.toFixed(2) : value.toFixed(4)) : String(value || 'N/A')}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress & Image Extras */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-px bg-white/5 flex-1" />
                      Management Data
                      <div className="h-px bg-white/5 flex-1" />
                    </h4>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-blue-300 tracking-wide">Progress Status</label>
                      <select
                        value={featureExtras[selectedFeature.id]?.progress || 'Not Started'}
                        onChange={(e) => handleExtraChange(selectedFeature.id, 'progress', e.target.value)}
                        className="w-full text-sm p-3 rounded-xl border border-white/10 bg-black/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer hover:bg-black/70"
                      >
                        <option value="Not Started" className="bg-slate-900">⚪ Not Started</option>
                        <option value="In Progress" className="bg-slate-900">🔵 In Progress</option>
                        <option value="Completed" className="bg-slate-900">🟢 Completed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-blue-300 tracking-wide">Site Photo</label>
                      {featureExtras[selectedFeature.id]?.image ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video flex items-center justify-center">
                          <img
                            src={featureExtras[selectedFeature.id].image!}
                            alt="Feature"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-300 flex items-center justify-center">
                            <Button
                              variant="destructive"
                              className="text-xs rounded-xl shadow-2xl font-semibold px-6"
                              onClick={() => handleExtraChange(selectedFeature.id, 'image', null)}
                            >
                              Remove Photo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 mb-3 group-hover:bg-blue-500/30 transition-colors group-hover:scale-110 duration-300">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-semibold text-white mb-1">Upload Photo</span>
                          <span className="text-[10px] text-slate-400 tracking-wider">JPEG, PNG, WEBP</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                handleExtraChange(selectedFeature.id, 'image', url);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
