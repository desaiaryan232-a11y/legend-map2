import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { useGeographic } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import { LineString, Polygon } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { MousePointer2 as CursorIcon, Ruler as RulerIcon, Square as SquareIcon, ZoomIn, Plus, Minus } from 'lucide-react';
import 'ol/ol.css';

export const geoServerUrl = "http://localhost:8081/geoserver/wms";

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

interface MapViewProps {
  visibleLayers: LayerVisibility;
  activeTool?: ActiveTool;
  onToolChange?: (tool: ActiveTool) => void;
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

const MapView = ({ visibleLayers, activeTool = 'cursor', onToolChange }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const layersRef = useRef<Record<string, TileLayer<TileWMS>>>({});

  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const measureTooltipElementRef = useRef<HTMLDivElement | null>(null);
  const measureTooltipRef = useRef<Overlay | null>(null);

  const [featureInfo, setFeatureInfo] = useState<{ properties: any, coordinate: number[] } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    useGeographic();

    const wmsLayers: Record<string, TileLayer<TileWMS>> = {};
    (Object.keys(layerMapping) as Array<keyof LayerVisibility>).forEach((key) => {
      wmsLayers[key] = new TileLayer({
        source: new TileWMS({
          url: geoServerUrl,
          params: { 'LAYERS': layerMapping[key], 'TILED': true, 'TRANSPARENT': true },
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

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), ...Object.values(wmsLayers), drawVectorLayerRef.current],
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
        layersRef.current[key].setVisible(visibleLayers[key]);
      }
    });
  }, [visibleLayers]);

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
      setFeatureInfo(null); // Clear previous

      if (activeTool !== 'cursor') return; // Don't query if measuring

      const viewResolution = map.getView().getResolution();
      const viewProjection = map.getView().getProjection();

      // Iterate through keys backwards to get top-most visible layer
      const keys = Object.keys(layerMapping).reverse() as Array<keyof LayerVisibility>;

      for (const key of keys) {
        if (visibleLayers[key]) {
          const layer = layersRef.current[key];
          if (!layer) continue;

          const source = layer.getSource();
          if (!source) continue;

          const url = source.getFeatureInfoUrl(
            evt.coordinate,
            viewResolution!,
            viewProjection,
            { 'INFO_FORMAT': 'application/json' }
          );

          if (url) {
            try {
              const response = await fetch(url);
              const data = await response.json();
              if (data && data.features && data.features.length > 0) {
                setFeatureInfo({
                  properties: data.features[0].properties,
                  coordinate: evt.coordinate
                });
                break; // Stop after finding the first feature
              }
            } catch (error) {
              console.error("Error fetching feature info:", error);
            }
          }
        }
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [activeTool, visibleLayers]);

  return (
    <div className="relative w-full h-full bg-slate-950">

      {/* Tool Selection Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur border border-white/10 rounded-xl shadow-2xl">
        <button
          onClick={() => onToolChange?.('cursor')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${activeTool === 'cursor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Normal Cursor"
        >
          <CursorIcon size={18} />
        </button>
        <button
          onClick={() => onToolChange?.('distance')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${activeTool === 'distance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Measure Distance"
        >
          <RulerIcon size={18} />
        </button>
        <button
          onClick={() => onToolChange?.('area')}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${activeTool === 'area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Measure Area"
        >
          <SquareIcon size={18} />
        </button>

        {/* Zoom Controls */}
        <div className="pl-2 ml-1 border-l border-white/10 flex items-center gap-1">
          <button
            onClick={() => setIsZoomOpen(!isZoomOpen)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isZoomOpen ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Zoom Tools"
          >
            <ZoomIn size={18} />
          </button>

          {isZoomOpen && (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
              <button
                onClick={() => {
                  const view = mapInstanceRef.current?.getView();
                  if (view) view.setZoom((view.getZoom() || 16) + 1);
                }}
                className="p-2 rounded-lg transition-colors flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 bg-black/20"
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => {
                  const view = mapInstanceRef.current?.getView();
                  if (view) view.setZoom((view.getZoom() || 16) - 1);
                }}
                className="p-2 rounded-lg transition-colors flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 bg-black/20"
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Clear Measurements */}
        {(activeTool === 'distance' || activeTool === 'area') && (
          <div className="pl-2 ml-1 border-l border-white/10">
            <button
              onClick={() => {
                drawSourceRef.current?.clear();
                // Clear tooltips
                mapInstanceRef.current?.getOverlays().clear();
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {/* Feature Info Popup */}
      {featureInfo && (
        <div
          className="absolute z-30 bg-white dark:bg-slate-900 border border-border shadow-xl rounded-xl p-4 max-w-sm"
          style={{
            // Rough positioning translation from map coordinates to screen coordinates
            // We ideally should use an ol/Overlay for this, but doing it simple via React for now
            // Because we need map.getPixelFromCoordinate. 
          }}
        >
          {/* Fallback to absolutely positioning inside map div */}
          {(() => {
            const map = mapInstanceRef.current;
            if (!map) return null;
            const pixel = map.getPixelFromCoordinate(featureInfo.coordinate);
            if (!pixel) return null;

            return (
              <div
                className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-4 min-w-[200px]"
                style={{ left: pixel[0] + 15, top: pixel[1] + 15 }}
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-sm">Feature Details</h4>
                  <button onClick={() => setFeatureInfo(null)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(featureInfo.properties).map(([key, value]) => {
                    // Filter out useless internal geoserver keys
                    if (key === 'bbox' || key.startsWith('geom')) return null;
                    return (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 text-right">
                          {typeof value === 'number' ? (value > 1000 ? value.toFixed(2) : value.toFixed(4)) : String(value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  );
};

export default MapView;