"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2 } from 'lucide-react';

// Fix Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapPickerProps {
    value?: string;
    onChange: (location: string) => void;
}

// Component to handle map clicks
function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelected(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to handle map flyTo
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { animate: true });
        }
    }, [center, map]);
    return null;
}

export default function LocationMapPicker({ value = "", onChange }: LocationMapPickerProps) {
    const [searchQuery, setSearchQuery] = useState(value);
    const [position, setPosition] = useState<[number, number]>([10.3157, 123.8854]); // Default to Cebu City
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Initial load geocoding if value is provided and different from search query
    useEffect(() => {
        if (value && value !== searchQuery && !position) {
            handleSearch(value);
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setPosition([lat, lon]);
        setSearchQuery(result.display_name);
        onChange(result.display_name);
        setShowResults(false);
    };

    const handleMapClick = async (lat: number, lng: number) => {
        setPosition([lat, lng]);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                setSearchQuery(data.display_name);
                onChange(data.display_name);
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative" ref={searchRef}>
                <div className="relative flex items-center shadow-sm rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all">
                    <Search className="absolute left-3.5 text-gray-400 z-10" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            onChange(e.target.value); // also update the parent value manually
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearch(searchQuery);
                            }
                        }}
                        placeholder="Type venue and press Enter or Find..."
                        className="w-full pl-11 pr-20 py-3 bg-transparent text-sm outline-none dark:text-white"
                    />
                    <div className="absolute right-1.5 z-10 flex items-center h-full py-1.5">
                        {isSearching ? (
                            <div className="px-4 flex items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={18} />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSearch(searchQuery)}
                                className="h-full px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-[8px] transition-colors shadow-sm"
                            >
                                Find
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                        {searchResults.map((result, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelectResult(result)}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.display_name.split(',')[0]}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.display_name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <style>{`.leaflet-control-attribution { display: none !important; }`}</style>
            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner relative z-0 ring-1 ring-black/5">
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents onLocationSelected={handleMapClick} />
                    <MapController center={position} />
                    {position && (
                        <Marker position={position}>
                            <Popup>{searchQuery || "Selected Location"}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                You can search for an address or click anywhere on the map to drop a pin.
            </p>
        </div>
    );
}
