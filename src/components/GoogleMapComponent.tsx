import React, { useEffect, useState, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { Coordinates, Restaurant } from "../types";
import { Compass, Route as RouteIcon, MapPin, Star, ShoppingBag } from "lucide-react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface GoogleMapProps {
  mode: "marketplace" | "tracking";
  restaurants?: Restaurant[];
  onSelectRestaurant?: (rest: Restaurant) => void;
  restaurantCoords?: Coordinates;
  customerCoords: Coordinates;
  driverCoords?: Coordinates;
  restaurantName?: string;
  customerName?: string;
  status?: string;
}

function RoutesRenderer({ origin, destination }: { origin: Coordinates; destination: Coordinates }) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;
    
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: "DRIVING",
      fields: ["path", "viewport"],
    }).then(({ routes }) => {
      if (routes && routes[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: "#ea580c",
            strokeOpacity: 0.8,
            strokeWeight: 5,
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    }).catch(() => {
      const fallbackPolyline = new google.maps.Polyline({
        path: [
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng }
        ],
        strokeColor: "#ea580c",
        strokeOpacity: 0.6,
        strokeWeight: 4,
      } as any);
      fallbackPolyline.setMap(map);
      polylinesRef.current = [fallbackPolyline];
      
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: origin.lat, lng: origin.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

function RestaurantMarker({ rest, onSelect }: { rest: Restaurant; onSelect?: (rest: Restaurant) => void; key?: string }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: rest.coords.lat, lng: rest.coords.lng }}
        onClick={() => setOpen(true)}
      >
        <Pin background="#ea580c" glyphColor="#ffffff" borderColor="#c2410c" />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 min-w-[200px] text-slate-900">
            <h4 className="font-bold text-sm text-slate-900">{rest.name}</h4>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{rest.address}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold text-slate-800">{rest.rating}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-slate-400 font-semibold">{rest.category}</span>
            </div>
            {onSelect && (
              <button
                onClick={() => {
                  onSelect(rest);
                  setOpen(false);
                }}
                className="w-full mt-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold py-1.5 px-2 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingBag className="h-3 w-3" />
                <span>Explore Menu</span>
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function GoogleMapComponent({
  mode,
  restaurants = [],
  onSelectRestaurant,
  restaurantCoords,
  customerCoords,
  driverCoords,
  status = "placed"
}: GoogleMapProps) {
  const [currentDriverPos, setCurrentDriverPos] = useState<Coordinates>(restaurantCoords || customerCoords);
  const [distance, setDistance] = useState<string>("2.4 km");
  const [eta, setEta] = useState<number>(12);

  useEffect(() => {
    if (mode !== "tracking" || !restaurantCoords) return;

    if (driverCoords) {
      setCurrentDriverPos(driverCoords);
      return;
    }

    if (status === "placed" || status === "accepted" || status === "cooking") {
      setCurrentDriverPos(restaurantCoords);
      setDistance("2.4 km");
      setEta(12);
      return;
    }

    let progress = 0;
    const intervalTime = 300;

    const timer = setInterval(() => {
      progress += 0.01;
      if (progress >= 1.0) {
        progress = 1.0;
        clearInterval(timer);
      }

      const lat = restaurantCoords.lat + (customerCoords.lat - restaurantCoords.lat) * progress;
      const curveOffset = Math.sin(progress * Math.PI) * 0.002;
      const lng = restaurantCoords.lng + (customerCoords.lng - restaurantCoords.lng) * progress + curveOffset;

      setCurrentDriverPos({ lat, lng });

      const remDistance = (2.4 * (1 - progress)).toFixed(1);
      setDistance(`${remDistance} km`);
      
      const remEta = Math.max(1, Math.round(12 * (1 - progress)));
      setEta(remEta);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [mode, driverCoords, restaurantCoords, customerCoords, status]);

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-full min-h-[350px] rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="h-12 w-12 rounded-full bg-orange-600/15 text-orange-500 flex items-center justify-center mx-auto animate-bounce">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold font-display">Google Maps API Key Required</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get an API Key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-bold">Get an API Key</a>
          </p>
          <div className="bg-slate-950/60 rounded-xl p-4 text-left text-xs text-slate-400 space-y-2 border border-slate-800/80">
            <p className="font-bold text-slate-300">To add your API key in AI Studio:</p>
            <ol className="list-decimal pl-4 space-y-1 font-semibold">
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right corner)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the name</li>
              <li>Paste your Google Maps API key as the value</li>
            </ol>
          </div>
          <p className="text-[10px] text-slate-500">The application will build automatically once key is added.</p>
        </div>
      </div>
    );
  }

  const mapCenter = mode === "tracking" && restaurantCoords 
    ? { lat: (restaurantCoords.lat + customerCoords.lat) / 2, lng: (restaurantCoords.lng + customerCoords.lng) / 2 }
    : { lat: customerCoords.lat, lng: customerCoords.lng };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xs">
      {mode === "tracking" && (
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between rounded-xl bg-white/95 backdrop-blur-md px-4 py-3 border border-slate-200/80 shadow-xs text-slate-800 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600/10 text-orange-600">
              <Compass className="h-4.5 w-4.5 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Estimated Delivery</div>
              <div className="text-xs font-bold text-slate-800">
                {status === "delivered" ? (
                  <span className="text-emerald-600">Delivered! Enjoy your meal</span>
                ) : status === "cancelled" ? (
                  <span className="text-rose-600">Order Cancelled</span>
                ) : (
                  <span>{eta} mins ({distance} away)</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600 border border-orange-100">
            <RouteIcon className="h-3.5 w-3.5" />
            <span>Active Live GPS</span>
          </div>
        </div>
      )}

      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={mode === "tracking" ? 13 : 12}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          style={{ width: "100%", height: "100%" }}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          {mode === "marketplace" ? (
            <>
              <AdvancedMarker position={{ lat: customerCoords.lat, lng: customerCoords.lng }}>
                <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1d4ed8" />
              </AdvancedMarker>
              {restaurants.map((rest) => (
                <RestaurantMarker key={rest.id} rest={rest} onSelect={onSelectRestaurant} />
              ))}
            </>
          ) : (
            restaurantCoords && (
              <>
                <AdvancedMarker position={{ lat: customerCoords.lat, lng: customerCoords.lng }}>
                  <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1d4ed8" />
                </AdvancedMarker>
                
                <AdvancedMarker position={{ lat: restaurantCoords.lat, lng: restaurantCoords.lng }}>
                  <Pin background="#ea580c" glyphColor="#ffffff" borderColor="#c2410c" />
                </AdvancedMarker>
                
                {status !== "placed" && status !== "delivered" && status !== "cancelled" && (
                  <AdvancedMarker position={{ lat: currentDriverPos.lat, lng: currentDriverPos.lng }}>
                    <Pin background="#10b981" glyphColor="#ffffff" borderColor="#047857" />
                  </AdvancedMarker>
                )}

                <RoutesRenderer origin={restaurantCoords} destination={customerCoords} />
              </>
            )
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
