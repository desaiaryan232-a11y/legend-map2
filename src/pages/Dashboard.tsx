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
  Maximize2,
  Minimize2
} from 'lucide-react';

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

  const toggleLayer = (key: keyof LayerVisibility) => {
    setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 sidebar-panel transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Control Panel</h2>
                <p className="text-xs text-muted-foreground">Toggle map layers</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hover:bg-sidebar-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Legend Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(Object.keys(visibleLayers) as Array<keyof LayerVisibility>).map((key, index) => (
              <div
                key={key}
                className="bg-card/50 rounded-xl border border-border/50 transition-all animate-slide-in-left overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm font-semibold text-foreground capitalize truncate pr-2">
                    {key.replace('_', ' ')}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Legend Action */}
                    <button
                      onClick={() => setOpenLegendKey(openLegendKey === key ? null : key)}
                      className={`p-1.5 rounded-lg transition-colors ${openLegendKey === key
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      <Info size={16} />
                    </button>
                    {/* Switch Toggle */}
                    <button
                      onClick={() => toggleLayer(key)}
                      className={`relative w-10 h-5 rounded-full transition-all ${visibleLayers[key] ? 'bg-primary' : 'bg-muted'
                        }`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-background rounded-full transition-all ${visibleLayers[key] ? 'left-6' : 'left-1'
                        }`} />
                    </button>
                  </div>
                </div>

                {/* LEGEND DISPLAY */}
                {openLegendKey === key && (
                  <div className="px-3 pb-4 pt-2 border-t border-border/50 bg-black/5">
                    <img
                      src={`${geoServerUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layerMapping[key]}&LEGEND_OPTIONS=fontSize:10&TRANSPARENT=true`}
                      alt="legend"
                      className="max-w-full opacity-90 mix-blend-multiply dark:mix-blend-normal"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen ${isMapMaximized ? 'fixed inset-0 z-[100] bg-background' : ''}`}>
        {/* Top Bar - Hide when maximized */}
        {!isMapMaximized && (
          <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hover:bg-muted"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" />
                <h1 className="font-semibold text-foreground">MAT Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                <Navigation className="w-4 h-4" />
                <span className="font-mono text-xs">Ready</span>
              </div>
            </div>
          </header>
        )}

        {/* Map Container */}
        <div className={`p-4 transition-all duration-300 ${isMapMaximized ? 'flex-1 p-0' : 'flex-1'}`}>
          <div className={`map-container h-full relative overflow-hidden ${isMapMaximized ? 'rounded-none' : 'rounded-2xl'}`}>
            <MapView
              visibleLayers={visibleLayers}
              isMaximized={isMapMaximized}
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />

            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsMapMaximized(!isMapMaximized)}
                className="bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 shadow-sm"
                title={isMapMaximized ? "Minimize Map" : "Maximize Map"}
              >
                {isMapMaximized ? (
                  <Minimize2 className="w-4 h-4 text-foreground" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-foreground" />
                )}
              </Button>
            </div>

            {/* Corner decoration */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>OpenLayers Map</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
