import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    // Changed port to 8084 because your GeoServer is using 8081.
    // This matches the "localhost:8084/dashboard" seen in your browser screenshots.
    port: 8084, 
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
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