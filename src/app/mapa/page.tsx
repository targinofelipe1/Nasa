'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Loader2,
  TreePine,
  Building2,
  Globe2,
  Search,
} from 'lucide-react';
import { GoogleMap, LoadScript, Marker, Libraries } from '@react-google-maps/api';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import Sidebar from '../components-antigo/Sidebar';


type ExtendedMapTypeId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain' | 'vegetation';

interface CityMetric {
  [year: string]: number;
}
interface CityData {
  name: string;
  estado: string;
  lat: number;
  lng: number;
  metrics: { [category: string]: CityMetric };
  ibge_code: string;
}
interface MapBiomasData {
  cities: CityData[];
  years: string[];
}

const useMapBiomasData = () => {
  const MOCK_CITIES: CityData[] = [
    {
      name: 'João Pessoa',
      estado: 'PB',
      lat: -7.1194,
      lng: -34.8645,
      ibge_code: '2507507',
      metrics: { '1. Forest': { '2023': 5000 }, '4. Non vegetated area': { '2023': 12000 } } as any,
    },
    {
      name: 'Natal',
      estado: 'RN',
      lat: -5.795,
      lng: -35.209,
      ibge_code: '2408102',
      metrics: { '1. Forest': { '2023': 4500 }, '4. Non vegetated area': { '2023': 10000 } } as any,
    },
    {
      name: 'Recife',
      estado: 'PE',
      lat: -8.0578,
      lng: -34.882,
      ibge_code: '2611606',
      metrics: { '1. Forest': { '2023': 3800 }, '4. Non vegetated area': { '2023': 15000 } } as any,
    },
    {
      name: 'Fortaleza',
      estado: 'CE',
      lat: -3.7327,
      lng: -38.5269,
      ibge_code: '2304400',
      metrics: { '1. Forest': { '2023': 6000 }, '4. Non vegetated area': { '2023': 20000 } } as any,
    },
    {
      name: 'Salvador',
      estado: 'BA',
      lat: -12.9714,
      lng: -38.5014,
      ibge_code: '2927408',
      metrics: { '1. Forest': { '2023': 7000 }, '4. Non vegetated area': { '2023': 18000 } } as any,
    },
  ];
  return { data: { cities: MOCK_CITIES, years: ['2023'] }, loading: false, error: null };
};

const formatValue = (value: number, unit: string = 'ha') => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${unit}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ${unit}`;
  return `${value.toLocaleString('pt-BR')} ${unit}`;
};

const getStateAbbreviation = (state: string) => {
  const abbreviations: Record<string, string> = {
    Bahia: 'BA',
    Ceará: 'CE',
    Paraíba: 'PB',
    Pernambuco: 'PE',
    'Rio Grande do Norte': 'RN',
  };
  return abbreviations[state] || state;
};

// ====================================================================
// 2️⃣ COMPONENTE PRINCIPAL
// ====================================================================
const MapaGlobal: React.FC = () => {
  const { data, loading, error } = useMapBiomasData();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCityName, setSelectedCityName] = useState('');
  const [mapType, setMapType] = useState<ExtendedMapTypeId>('roadmap');

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (data && data.cities.length > 0) {
      if (selectedCityName === '') {
        setSelectedCityName(data.cities[0].name);
      } else {
        const currentIndex = data.cities.findIndex((c) => c.name === selectedCityName);
        if (currentIndex !== -1) setSelectedIndex(currentIndex);
      }
    }
  }, [data, selectedCityName]);

  const cities = data?.cities || [];
  const selectedCity = cities[selectedIndex];
  const latestYear = data?.years[data.years.length - 1] || '2023';

  const mapCenter = useMemo(
    () => ({
      lat: selectedCity?.lat ?? -7.1194,
      lng: selectedCity?.lng ?? -34.8645,
    }),
    [selectedCity]
  );

  const libraries = useMemo(() => ['places', 'drawing'] as Libraries, []);
  const mapContainerStyle = { width: '100%', height: '60vh', borderRadius: '12px' };

  // 🟢 Tema customizado de vegetação
  const vegetationStyle: google.maps.MapTypeStyle[] = [
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#d9f7d6' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#b8e8a5' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bde0fe' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
    { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#4b6043' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  ];

  const mapOptions: google.maps.MapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      styles: mapType === 'vegetation' ? vegetationStyle : undefined,
      mapTypeId: mapType === 'vegetation' ? google.maps.MapTypeId.ROADMAP : mapType,
    }),
    [mapType]
  );

  const goToNext = () => {
    const newIndex = (selectedIndex + 1) % cities.length;
    setSelectedIndex(newIndex);
    setSelectedCityName(cities[newIndex].name);
  };
  const goToPrev = () => {
    const newIndex = (selectedIndex - 1 + cities.length) % cities.length;
    setSelectedIndex(newIndex);
    setSelectedCityName(cities[newIndex].name);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-emerald-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );

  if (error || !data || cities.length === 0)
    return (
      <div className="flex items-center justify-center h-64 bg-white shadow-lg m-6 rounded-xl border border-emerald-200">
        <p className="text-emerald-700">Erro ao carregar dados do mapa ou cidades não encontradas.</p>
      </div>
    );

  return (
    <ProtectedRoute>
                <Sidebar />
    <div className="space-y-6 p-6 bg-white min-h-screen pt-24">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
        Mapa de Uso e Ocupação do Solo
      </h1>

      {/* 🔸 Seletor de tipo de mapa */}
      <div className="flex items-center gap-3 mb-2">
        <label htmlFor="mapType" className="text-sm font-medium text-gray-700">
          Visualização:
        </label>
        <select
          id="mapType"
          value={mapType}
          onChange={(e) => setMapType(e.target.value as ExtendedMapTypeId)}
          className="border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="roadmap">Padrão</option>
          <option value="satellite">Satélite</option>
          <option value="terrain">Terreno</option>
          <option value="hybrid">Híbrido</option>
          <option value="vegetation">Vegetação 🌿</option>
        </select>
      </div>

      {/* 🔹 Carrossel de Cidades */}
      <div className="bg-white p-4 rounded-xl shadow-lg border relative flex items-center overflow-hidden">
        <div className="absolute top-4 left-4 z-20">
          <label htmlFor="city-select" className="sr-only">
            Selecionar Cidade
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              id="city-select"
              value={selectedCityName}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedCityName(name);
                setSelectedIndex(cities.findIndex((c) => c.name === name));
              }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} ({getStateAbbreviation(city.estado)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-hidden md:px-12">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          >
            {cities.map((city) => (
              <div key={city.name} className="flex-shrink-0 w-full p-2" style={{ width: '100%' }}>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-3">
                  <h2 className="text-xl font-extrabold text-green-800">
                    {city.name} ({getStateAbbreviation(city.estado)})
                  </h2>
                  <p className="text-sm text-green-600">Dados de Uso do Solo ({latestYear})</p>

                  <div className="flex justify-around space-x-4">
                    <div className="text-left">
                      <TreePine className="w-5 h-5 text-green-800 mb-1" />
                      <span className="font-semibold text-gray-800">
                        {formatValue(city.metrics['1. Forest']?.[latestYear] || 0, 'ha')}
                      </span>
                      <div className="text-xs text-gray-500">Área Florestal</div>
                    </div>
                    <div className="text-left">
                      <Building2 className="w-5 h-5 text-red-600 mb-1" />
                      <span className="font-semibold text-gray-800">
                        {formatValue(city.metrics['4. Non vegetated area']?.[latestYear] || 0, 'ha')}
                      </span>
                      <div className="text-xs text-gray-500">Área Urbana</div>
                    </div>
                    <div className="text-left">
                      <MapPin className="w-5 h-5 text-purple-600 mb-1" />
                      <span className="font-semibold text-gray-800">{city.ibge_code}</span>
                      <div className="text-xs text-gray-500">Cód. IBGE</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Navegação */}
        <button
          onClick={goToPrev}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition absolute left-2 z-10 hidden md:block"
          aria-label="Cidade anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={goToNext}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition absolute right-2 z-10 hidden md:block"
          aria-label="Próxima cidade"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 🔹 Mapa Interativo */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Localização da Capital ({selectedCity?.name})
        </h3>

        <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={10}
            options={mapOptions}
          >
            {cities.map((city) => (
              <Marker key={city.name} position={{ lat: city.lat, lng: city.lng }} title={city.name} />
            ))}
          </GoogleMap>
        </LoadScript>

        {!API_KEY && (
          <p className="text-sm text-red-500 mt-3">
            ALERTA: A chave da API do Google Maps (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) não está configurada.
          </p>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default MapaGlobal;
