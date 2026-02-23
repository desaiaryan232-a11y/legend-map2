import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all network interfaces to resolve IPv4 vs IPv6 issues
    // Changed port to 8007 as requested
    port: 8008,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/geoserver': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    // mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Ensuring 'ol' is pre-bundled correctly for faster reloads
    include: ['ol', 'ol/Map', 'ol/View', 'ol/layer/Tile', 'ol/source/TileWMS', 'ol/source/OSM', 'ol/proj'],
  },
}));