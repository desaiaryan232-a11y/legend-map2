import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { useGeographic, transform } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import { LineString, Polygon } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { MousePointer2 as CursorIcon, Ruler as RulerIcon, Square as SquareIcon, ZoomIn, Plus, Minus } from 'lucide-react';
import 'ol/ol.css';

export const geoServerUrl = "/geoserver/wms";

export interface LayerVisibility {
  water: boolean;
  building: boolean;
  building_summary: boolean;
  roads: boolean;
  rail: boolean;
  bus: boolean;
  fire: boolean;
}

export const layerMapping: Record<keyof LayerVisibility, string> = {
  water: 'aryandesai_project:water_bodies_polygon',
  building: 'aryandesai_project:building',
  building_summary: 'aryandesai_project:building_summary',
  roads: 'aryandesai_project:road_line',
  rail: 'aryandesai_project:rail_line',
  bus: 'aryandesai_project:bus_stop',
  fire: 'aryandesai_project:fire_station_point',
};

export type ActiveTool = 'cursor' | 'distance' | 'area';

export interface SelectedFeatureData {
  id: string;
  properties: Record<string, any>;
  layerKey: string;
  rawFeature?: any;
}

interface MapViewProps {
  visibleLayers: LayerVisibility;
  activeTool?: ActiveTool;
  onToolChange?: (tool: ActiveTool) => void;
  onFeatureSelect?: (feature: SelectedFeatureData | null) => void;
  selectedFeature?: SelectedFeatureData | null;
}

const formatLength = (line: LineString) => {
  const length = getLength(line, { projection: 'EPSG:4326' });
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
  } else {
    output = Math.round(length * 100) / 100 + ' ' + 'm';
  }
  return output;
};

const formatArea = (polygon: Polygon) => {
  const area = getArea(polygon, { projection: 'EPSG:4326' });
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
  } else {
    output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
  }
  return output;
};

const MapView = ({ visibleLayers, activeTool = 'cursor', onToolChange, onFeatureSelect, selectedFeature }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const layersRef = useRef<Record<string, TileLayer<TileWMS>>>({});

  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const measureTooltipElementRef = useRef<HTMLDivElement | null>(null);
  const measureTooltipRef = useRef<Overlay | null>(null);
  const highlightSourceRef = useRef<VectorSource | null>(null);
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const highlightWMSLayerRef = useRef<TileLayer<TileWMS> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    useGeographic();

    const wmsLayers: Record<string, TileLayer<TileWMS>> = {};
    (Object.keys(layerMapping) as Array<keyof LayerVisibility>).forEach((key) => {
      wmsLayers[key] = new TileLayer({
        source: new TileWMS({
          url: geoServerUrl,
          params: { 'LAYERS': layerMapping[key], 'TILED': true, 'TRANSPARENT': true, 'VERSION': '1.1.1' },
        }),
        visible: visibleLayers[key],
      });
    });

    layersRef.current = wmsLayers;

    drawSourceRef.current = new VectorSource();
    drawVectorLayerRef.current = new VectorLayer({
      source: drawSourceRef.current,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });

    highlightSourceRef.current = new VectorSource();
    highlightLayerRef.current = new VectorLayer({
      source: highlightSourceRef.current,
      // Stroke-only outline so the WMS original colours show through
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(251, 191, 36, 1)',
          width: 3,
        }),
        image: new CircleStyle({
          radius: 9,
          fill: new Fill({ color: 'rgba(251, 191, 36, 0.9)' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        }),
      }),
    });

    // WMS highlight layer (hidden until a feature is selected)
    highlightWMSLayerRef.current = new TileLayer({
      source: new TileWMS({
        url: geoServerUrl,
        params: { 'LAYERS': '', 'TILED': true, 'TRANSPARENT': true, 'VERSION': '1.1.1' },
      }),
      visible: false,
      zIndex: 100,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), ...Object.values(wmsLayers), drawVectorLayerRef.current, highlightWMSLayerRef.current, highlightLayerRef.current],
      view: new View({ center: [72.966, 19.197], zoom: 16 }),
    });

    mapInstanceRef.current = map;
    return () => {
      map.setTarget(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (Object.keys(visibleLayers) as Array<keyof LayerVisibility>).forEach((key) => {
      if (layersRef.current[key]) {
        const layer = layersRef.current[key];
        layer.setVisible(visibleLayers[key]);
        // Dim ALL WMS layers when a feature is selected; the highlight
        // vector overlay on top will make only the clicked item stand out.
        layer.setOpacity(selectedFeature ? 0.15 : 1);
      }
    });

    if (highlightSourceRef.current) {
      highlightSourceRef.current.clear();
    }

    if (highlightWMSLayerRef.current) {
      if (selectedFeature && selectedFeature.rawFeature) {
        // Show only the clicked feature using its GeoServer ID via FEATUREID filter
        const featureId = selectedFeature.rawFeature.id;
        const wmsLayerName = layerMapping[selectedFeature.layerKey as keyof LayerVisibility];
        const source = highlightWMSLayerRef.current.getSource();
        if (source && featureId && wmsLayerName) {
          source.updateParams({
            'LAYERS': wmsLayerName,
            'FEATUREID': featureId,
          });
          source.refresh();
        }
        highlightWMSLayerRef.current.setVisible(true);

        // Also draw outline via vector overlay
        if (selectedFeature.rawFeature && highlightSourceRef.current) {
          try {
            const feature = new GeoJSON().readFeature(selectedFeature.rawFeature, {
              dataProjection: 'EPSG:4326',
              featureProjection: mapInstanceRef.current?.getView().getProjection() || 'EPSG:3857',
            });
            highlightSourceRef.current.addFeature(feature as any);
          } catch (e) {
            console.error('Failed to parse highlight geometry:', e);
          }
        }
      } else {
        highlightWMSLayerRef.current.setVisible(false);
      }
    }
  }, [visibleLayers, selectedFeature]);

  // Handle Tool Changes (Draw Interactions)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing interaction
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    // Set cursor style
    if (mapRef.current) {
      mapRef.current.style.cursor = activeTool !== 'cursor' ? 'crosshair' : 'default';
    }

    if (activeTool === 'distance' || activeTool === 'area') {
      const type = activeTool === 'distance' ? 'LineString' : 'Polygon';

      const draw = new Draw({
        source: drawSourceRef.current!,
        type: type as any,
        style: new Style({
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
          stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2 }),
          image: new CircleStyle({ radius: 5, stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }), fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }) }),
        }),
      });

      map.addInteraction(draw);
      drawInteractionRef.current = draw;

      let listener: any;
      let sketch: any;

      const createMeasureTooltip = () => {
        if (measureTooltipElementRef.current) {
          measureTooltipElementRef.current.parentNode?.removeChild(measureTooltipElementRef.current);
        }
        measureTooltipElementRef.current = document.createElement('div');
        measureTooltipElementRef.current.className = 'ol-tooltip ol-tooltip-measure bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap';
        measureTooltipRef.current = new Overlay({
          element: measureTooltipElementRef.current,
          offset: [0, -15],
          positioning: 'bottom-center',
          stopEvent: false,
          insertFirst: false,
        });
        map.addOverlay(measureTooltipRef.current);
      };

      draw.on('drawstart', (evt: any) => {
        sketch = evt.feature;
        let tooltipCoord = evt.coordinate;
        createMeasureTooltip();

        listener = sketch.getGeometry().on('change', (e: any) => {
          const geom = e.target;
          let output;
          if (geom instanceof Polygon) {
            output = formatArea(geom);
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
          } else if (geom instanceof LineString) {
            output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
          }
          if (measureTooltipElementRef.current) {
            measureTooltipElementRef.current.innerHTML = output || '';
          }
          measureTooltipRef.current?.setPosition(tooltipCoord);
        });
      });

      draw.on('drawend', () => {
        if (measureTooltipElementRef.current) {
          measureTooltipElementRef.current.className = 'ol-tooltip ol-tooltip-static bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap';
        }
        measureTooltipRef.current?.setOffset([0, -7]);
        sketch = null;
        measureTooltipElementRef.current = null;
        createMeasureTooltip();
        unByKey(listener);
      });
    }

    return () => {
      if (drawInteractionRef.current && map) {
        map.removeInteraction(drawInteractionRef.current);
      }
    };
  }, [activeTool]);

  // Handle GetFeatureInfo Clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (evt: any) => {
      if (activeTool !== 'cursor') return; // Don't query if measuring

      if (onFeatureSelect) onFeatureSelect(null); // Clear previous in parent

      const viewResolution = map.getView().getResolution();
      const viewProjection = map.getView().getProjection();

      const internalCoordinate = transform(evt.coordinate, 'EPSG:4326', viewProjection);

      console.log("Map clicked at coordinate:", evt.coordinate);
      console.log("Internal Coordinate for WMS bounds:", internalCoordinate);

      // Iterate through keys backwards to get top-most visible layer
      const keys = Object.keys(layerMapping).reverse() as Array<keyof LayerVisibility>;

      let featureFound = false;

      for (const key of keys) {
        if (visibleLayers[key]) {
          const layer = layersRef.current[key];
          if (!layer) continue;

          const source = layer.getSource();
          if (!source) continue;

          const url = source.getFeatureInfoUrl(
            internalCoordinate,
            viewResolution!,
            viewProjection,
            { 'INFO_FORMAT': 'application/json', 'BUFFER': 30, 'FEATURE_COUNT': 5 }
          );

          if (url) {
            console.log(`Requesting layer ${key}:`, url);
            try {
              const response = await fetch(url);
              if (!response.ok) {
                const text = await response.text();
                console.error(`GeoServer Error for ${key}:`, text);
                continue;
              }

              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("text/html")) {
                alert("The map proxy isn't working yet! You must restart your terminal with 'npm run dev' to apply the Geoserver proxy settings.");
                return;
              }

              const data = await response.json();
              console.log(`GeoServer Response for ${key}:`, data);

              if (data && data.features && data.features.length > 0) {
                console.log("Feature found!", data.features[0]);
                if (onFeatureSelect) {
                  onFeatureSelect({
                    id: data.features[0].id || `${layerMapping[key]}-${Date.now()}`,
                    properties: data.features[0].properties,
                    layerKey: key,
                    rawFeature: data.features[0]
                  });
                }
                featureFound = true;
                break; // Stop after finding the first feature
              }
            } catch (error) {
              console.error(`Error fetching feature info JSON for ${key} (check browser console / GeoServer logs):`, error);
            }
          }
        }
      }

      if (!featureFound) {
        console.warn("No features were returned by Geoserver at this coordinate for any visible layer.");
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [activeTool, visibleLayers]);

  return (
    <div className="relative w-full h-full bg-slate-950">

      {/* Tool Selection Bar (Glassmorphic, Bottom) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:bg-black/50 hover:border-white/20">
        <button
          onClick={() => onToolChange?.('cursor')}
          className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTool === 'cursor' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Normal Cursor"
        >
          <CursorIcon size={20} />
        </button>
        <button
          onClick={() => onToolChange?.('distance')}
          className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTool === 'distance' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Measure Distance"
        >
          <RulerIcon size={20} />
        </button>
        <button
          onClick={() => onToolChange?.('area')}
          className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTool === 'area' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Measure Area"
        >
          <SquareIcon size={20} />
        </button>

        {/* Zoom Controls */}
        <div className="pl-2 ml-1 border-l border-white/10 flex items-center gap-1.5">
          <button
            onClick={() => setIsZoomOpen(!isZoomOpen)}
            className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${isZoomOpen ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Zoom Tools"
          >
            <ZoomIn size={20} />
          </button>

          {isZoomOpen && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <button
                onClick={() => {
                  const view = mapInstanceRef.current?.getView();
                  if (view) view.setZoom((view.getZoom() || 16) + 1);
                }}
                className="p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 bg-black/20"
                title="Zoom In"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => {
                  const view = mapInstanceRef.current?.getView();
                  if (view) view.setZoom((view.getZoom() || 16) - 1);
                }}
                className="p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 bg-black/20"
                title="Zoom Out"
              >
                <Minus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Clear Measurements */}
        {(activeTool === 'distance' || activeTool === 'area') && (
          <div className="pl-2 ml-1 border-l border-white/10 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                drawSourceRef.current?.clear();
                // Clear tooltips
                mapInstanceRef.current?.getOverlays().clear();
              }}
              className="px-4 py-2 text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0)] hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] border border-rose-500/0 hover:border-rose-500/50"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;