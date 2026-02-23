// vite.config.ts
import { defineConfig } from "file:///Users/triissh/Desktop/INTERNSHIP/legend-map2/node_modules/vite/dist/node/index.js";
import react from "file:///Users/triissh/Desktop/INTERNSHIP/legend-map2/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///Users/triissh/Desktop/INTERNSHIP/legend-map2/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/triissh/Desktop/INTERNSHIP/legend-map2";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: true,
    // Listen on all network interfaces to resolve IPv4 vs IPv6 issues
    // Changed port to 8004 as requested
    port: 8004,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    // Ensuring 'ol' is pre-bundled correctly for faster reloads
    include: ["ol", "ol/Map", "ol/View", "ol/layer/Tile", "ol/source/TileWMS", "ol/source/OSM", "ol/proj"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdHJpaXNzaC9EZXNrdG9wL0lOVEVSTlNISVAvbGVnZW5kLW1hcDJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90cmlpc3NoL0Rlc2t0b3AvSU5URVJOU0hJUC9sZWdlbmQtbWFwMi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdHJpaXNzaC9EZXNrdG9wL0lOVEVSTlNISVAvbGVnZW5kLW1hcDIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsIC8vIExpc3RlbiBvbiBhbGwgbmV0d29yayBpbnRlcmZhY2VzIHRvIHJlc29sdmUgSVB2NCB2cyBJUHY2IGlzc3Vlc1xuICAgIC8vIENoYW5nZWQgcG9ydCB0byA4MDA0IGFzIHJlcXVlc3RlZFxuICAgIHBvcnQ6IDgwMDQsXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiBmYWxzZSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIC8vIEVuc3VyaW5nICdvbCcgaXMgcHJlLWJ1bmRsZWQgY29ycmVjdGx5IGZvciBmYXN0ZXIgcmVsb2Fkc1xuICAgIGluY2x1ZGU6IFsnb2wnLCAnb2wvTWFwJywgJ29sL1ZpZXcnLCAnb2wvbGF5ZXIvVGlsZScsICdvbC9zb3VyY2UvVGlsZVdNUycsICdvbC9zb3VyY2UvT1NNJywgJ29sL3Byb2onXSxcbiAgfSxcbn0pKTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlULFNBQVMsb0JBQW9CO0FBQ3RWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQTtBQUFBLElBRU4sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxFQUM1QyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQTtBQUFBLElBRVosU0FBUyxDQUFDLE1BQU0sVUFBVSxXQUFXLGlCQUFpQixxQkFBcUIsaUJBQWlCLFNBQVM7QUFBQSxFQUN2RztBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
