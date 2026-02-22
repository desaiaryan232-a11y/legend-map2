import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';
import { 
  Menu, 
  X, 
  MapPin, 
  Layers, 
  Navigation,
  Building2,
  TreePine,
  Waves,
  Route,
  Mountain,
  LogOut,
  Map
} from 'lucide-react';
// mayuresh r//
interface LegendItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const legendItems: LegendItem[] = [
  { id: 'markers', label: 'Location Markers', icon: MapPin, color: 'hsl(217 91% 60%)' },
  { id: 'routes', label: 'Routes & Paths', icon: Route, color: 'hsl(142 71% 45%)' },
  { id: 'buildings', label: 'Buildings', icon: Building2, color: 'hsl(280 65% 60%)' },
  { id: 'vegetation', label: 'Vegetation', icon: TreePine, color: 'hsl(142 76% 36%)' },
  { id: 'water', label: 'Water Bodies', icon: Waves, color: 'hsl(199 89% 48%)' },
  { id: 'terrain', label: 'Terrain', icon: Mountain, color: 'hsl(30 80% 55%)' },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

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
                <h2 className="font-semibold text-foreground">Map Legends</h2>
                <p className="text-xs text-muted-foreground">Toggle layers</p>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {legendItems.map((item, index) => (
              <div 
                key={item.id}
                className="legend-item animate-slide-in-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
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
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
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

        {/* Map Container */}
        <div className="flex-1 p-4">
          <div className="map-container h-full rounded-2xl relative overflow-hidden">
            <MapView />
            
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
