import { useEffect, useRef, useState } from 'react';

import Map from 'ol/Map';

import View from 'ol/View';

import TileLayer from 'ol/layer/Tile';

import TileWMS from 'ol/source/TileWMS';

import { useGeographic } from 'ol/proj';

import OSM from 'ol/source/OSM';

import { Layers, Droplets, Home, Waypoints, Train, Bus, Flame, ChevronRight, ChevronLeft, ChevronDown, Info } from 'lucide-react';

import 'ol/ol.css';



const geoServerUrl = "http://localhost:8081/geoserver/wms";



interface LayerVisibility {

  water: boolean; building: boolean; building_summary: boolean;

  roads: boolean; rail: boolean; bus: boolean; fire: boolean;

}



const layerMapping: Record<keyof LayerVisibility, string> = {

  water: 'aryandesai_project:water_bodies_polygon',

  building: 'aryandesai_project:building',

  building_summary: 'aryandesai_project:building_summary',

  roads: 'aryandesai_project:road_line',

  rail: 'aryandesai_project:rail_line',

  bus: 'aryandesai_project:bus_stop',

  fire: 'aryandesai_project:fire_station_point',

};



const MapView = () => {

  const mapRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<Map | null>(null);

  // FIX: Explicitly type the ref to avoid the 'BaseLayer' missing property error

  const layersRef = useRef<Record<string, TileLayer<TileWMS>>>({});

 

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [openLegendKey, setOpenLegendKey] = useState<string | null>(null);

  const [visibleLayers, setVisibleLayers] = useState<LayerVisibility>({

    water: true, building: true, building_summary: true, roads: true, rail: true, bus: true, fire: true,

  });



  useEffect(() => {

    if (!mapRef.current || mapInstanceRef.current) return;

    useGeographic();



    // FIX: Map the layers correctly with the right types

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



    const map = new Map({

      target: mapRef.current,

      layers: [new TileLayer({ source: new OSM() }), ...Object.values(wmsLayers)],

      view: new View({ center: [72.966, 19.197], zoom: 16 }),

    });



    mapInstanceRef.current = map;

    return () => map.setTarget(undefined);

  }, []);



  const toggleLayer = (key: keyof LayerVisibility) => {

    const newState = !visibleLayers[key];

    setVisibleLayers(prev => ({ ...prev, [key]: newState }));

    if (layersRef.current[key]) layersRef.current[key].setVisible(newState);

  };



  return (

    <div className="relative w-full h-screen bg-slate-950">

      {/* SIDEBAR UI FIX: Wider container and better positioning for toggles */}

      <div className={`absolute top-4 right-4 z-20 transition-all duration-300 flex items-start gap-3 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[330px]'}`}>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-900 border border-white/10 rounded-full shadow-xl text-white mt-2">

          {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}

        </button>



        <div className="w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5">

          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/5">

            <Layers className="text-blue-400" size={20} />

            <h3 className="font-bold text-white text-lg">Control Panel</h3>

          </div>



          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">

            {(Object.keys(visibleLayers) as Array<keyof LayerVisibility>).map((key) => (

              <div key={key} className="bg-white/5 rounded-xl border border-white/5 transition-all">

                <div className="flex items-center justify-between p-3">

                  <span className="text-xs font-bold text-slate-200 capitalize truncate pr-2">{key.replace('_', ' ')}</span>

                 

                  <div className="flex items-center gap-4">

                    {/* Legend Action */}

                    <button

                      onClick={() => setOpenLegendKey(openLegendKey === key ? null : key)}

                      className={`p-1.5 rounded-lg ${openLegendKey === key ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'}`}

                    >

                      <Info size={16} />

                    </button>

                    {/* Switch Toggle */}

                    <button

                      onClick={() => toggleLayer(key)}

                      className={`relative w-10 h-5 rounded-full transition-all ${visibleLayers[key] ? 'bg-blue-600' : 'bg-slate-700'}`}

                    >

                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${visibleLayers[key] ? 'left-6' : 'left-1'}`} />

                    </button>

                  </div>

                </div>



                {/* LEGEND DISPLAY: Pulls the correct style graphic from GeoServer */}

                {openLegendKey === key && (

                  <div className="px-3 pb-4 pt-2 border-t border-white/5 bg-black/20">

                    <img

                      src={`${geoServerUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layerMapping[key]}&LEGEND_OPTIONS=fontColor:0xFFFFFF;fontSize:10&TRANSPARENT=true`}

                      alt="legend"

                      className="max-w-full opacity-90"

                      onError={(e) => (e.currentTarget.style.display = 'none')}

                    />

                  </div>

                )}

              </div>

            ))}

          </div>

        </div>

      </div>



      <div ref={mapRef} className="w-full h-full" />

    </div>

  );

};



export default MapView;