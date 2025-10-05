'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, TrendingUp, TrendingDown, Minus, Layers3, Users, TreePine, Building2, Globe2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import Sidebar from '../components-antigo/Sidebar';
const API_MAPBIOMAS = '/api/sheets?programa=dados-detalhados';
const API_MUNICIPIOS = '/api/sheets?programa=municipios-consolidado'; 

enum CATEGORY_KEYS { 
    FOREST = '1. Forest', 
    URBAN = '4. Non vegetated area', 
    WATER = '5. Water and Marine Environment',
    FARMING = '3. Farming',
    NON_FOREST_NATURAL = '2. Non Forest Natural Formation',
}
const CATEGORY_LABELS: { [key: string]: string } = { 
    [CATEGORY_KEYS.FOREST]: 'Floresta', 
    [CATEGORY_KEYS.URBAN]: 'Urbana/Não Veg.', 
    [CATEGORY_KEYS.WATER]: 'Água',
    [CATEGORY_KEYS.FARMING]: 'Agropecuária',
    [CATEGORY_KEYS.NON_FOREST_NATURAL]: 'Outras Formações',
};
const CATEGORY_COLORS: { [key: string]: string } = { 
    [CATEGORY_KEYS.FOREST]: '#34D399', 
    [CATEGORY_KEYS.URBAN]: '#F87171', 
    [CATEGORY_KEYS.WATER]: '#38BDF8',
    [CATEGORY_KEYS.FARMING]: '#FBBF24',
    [CATEGORY_KEYS.NON_FOREST_NATURAL]: '#60A5FA',
};

const POPULATION_YEARS_COLUMNS = [
    'População (1985)', 'População (1991)', 'População (2000)',
    'População (2010)', 'População (2022)', 'População (2024)',
];

interface SheetRow {
    [key: string]: string | undefined;
    cidade: string;
    estado: string;
    nivel_1: string;
}
interface CityMetric { [year: string]: number; }
interface PopulationMetric { [year: string]: number; }
interface CityData {
    name: string;
    estado: string;
    metrics: { [category: string]: CityMetric; };
    population: PopulationMetric;
    ibge_code: string; 
}
interface MapBiomasData {
    metadata: { source: string; };
    years: string[];
    categories: CATEGORY_KEYS[];
    cities: CityData[];
}

const MAPBIOMAS_YEARS_KEYS = Array.from({ length: 39 }, (_, i) => (1985 + i).toString());

const cleanParse = (value: string | undefined): number => {
    if (!value) return 0;
    let cleaned = String(value).trim();
    cleaned = cleaned.replace(/\./g, '');
    cleaned = cleaned.replace(/,/g, '.');
    return parseFloat(cleaned) || 0;
};
const formatValue = (value: number, unit: string = 'ha') => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ${unit}`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K ${unit}`;
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ${unit}`;
};
const getStateAbbreviation = (state: string) => {
    const abbreviations: Record<string, string> = { 'Bahia': 'BA', 'Ceará': 'CE', 'Paraíba': 'PB', 'Pernambuco': 'PE', 'Rio Grande do Norte': 'RN' };
    return abbreviations[state] || state;
};

const calculateTrend = (timeSeries: any[], category: string) => {
    if (timeSeries.length < 10) return { direction: 'stable', percentage: 0, label: 'Dados insuficientes' };
    
    const recent = timeSeries.slice(-5);
    const previous = timeSeries.slice(-10, -5);
    
    if (recent.length < 5 || previous.length < 5) return { direction: 'stable', percentage: 0, label: 'Período incompleto' };
    
    const recentAvg = recent.reduce((sum, item) => sum + (item[category] || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + (item[category] || 0), 0) / previous.length;
    
    const prevYear = previous[0].year;
    
    if (previousAvg === 0) return { direction: 'stable', percentage: 0, label: `vs ${prevYear} (Média)` };
    
    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    return {
        direction: changePercent > 0.5 ? 'up' : changePercent < -0.5 ? 'down' : 'stable',
        percentage: Math.abs(changePercent),
        label: `vs ${prevYear} (Média)`
    };
};

const transformMunicipioData = (rawData: SheetRow[]): { [cityName: string]: Partial<CityData> } => {
    const municipioMap: { [cityName: string]: Partial<CityData> } = {};

    rawData.forEach(row => {
        const cityName = row.cidade;
        if (!cityName || municipioMap[cityName]) return; 

        const popMetrics: PopulationMetric = {};
        POPULATION_YEARS_COLUMNS.forEach(popColumn => {
            const year = popColumn.match(/\((\d{4})\)/)?.[1];
            const popValue = cleanParse(row[popColumn]); 
            if (year) {
                popMetrics[year] = popValue;
            }
        });
        
        const ibgeCode = row.codigo_ibge || 'N/A';

        municipioMap[cityName] = {
            population: popMetrics,
            ibge_code: ibgeCode,
            estado: row.estado,
        };
    });
    return municipioMap;
};

const transformMapBiomasData = (rawData: SheetRow[], municipioMap: { [cityName: string]: Partial<CityData> }): MapBiomasData => {
    if (!rawData.length) return { metadata: { source: 'Nenhum dado' }, years: [], categories: [], cities: [] };
    
    const categoriesSet = new Set<string>();
    const citiesMap = new Map<string, CityData>();
    
    const allKeys = new Set(rawData.flatMap(row => Object.keys(row)));
    const validMapBiomasYears = MAPBIOMAS_YEARS_KEYS.filter(year => allKeys.has(year)).sort();
    
    rawData.forEach(row => {
        const cityName = row.cidade;
        const categoryKey = row.nivel_1 as CATEGORY_KEYS; 
        
        if (!cityName) return;

        if (!citiesMap.has(cityName)) {
            const municipioDetail = municipioMap[cityName] || {};
            citiesMap.set(cityName, {
                name: cityName,
                estado: row.estado || municipioDetail.estado || 'N/A',
                ibge_code: municipioDetail.ibge_code || 'N/A',
                metrics: {},
                population: municipioDetail.population || {},
            });
        }
        const city = citiesMap.get(cityName)!;

        if (categoryKey && Object.values(CATEGORY_KEYS).includes(categoryKey)) {
            categoriesSet.add(categoryKey);

            if (!city.metrics[categoryKey]) city.metrics[categoryKey] = {};

            validMapBiomasYears.forEach(year => {
                const areaValue = cleanParse(row[year]);
                city.metrics[categoryKey][year] = (city.metrics[categoryKey][year] || 0) + areaValue;
            });
        }
    });
    
    const validCategories = Array.from(categoriesSet).filter(cat => Object.values(CATEGORY_KEYS).includes(cat as CATEGORY_KEYS)) as CATEGORY_KEYS[];

    return {
        metadata: { source: 'Dados_Detalhados & Municípios' },
        years: validMapBiomasYears,
        categories: validCategories,
        cities: Array.from(citiesMap.values()),
    };
};

// --- HOOK PRINCIPAL (Busca e Processa) ---
const useMapBiomasData = () => {
    const [data, setData] = useState<MapBiomasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMapBiomas, resMunicipios] = await Promise.all([
                    fetch(API_MAPBIOMAS),
                    fetch(API_MUNICIPIOS),
                ]);

                if (!resMapBiomas.ok || !resMunicipios.ok) {
                    throw new Error(`Erro HTTP: Falha ao buscar uma ou ambas as fontes.`);
                }

                const resultMapBiomas = await resMapBiomas.json();
                const resultMunicipios = await resMunicipios.json();
                
                const municipioMap = transformMunicipioData(resultMunicipios.data as SheetRow[]);
                const processedData = transformMapBiomasData(resultMapBiomas.data as SheetRow[], municipioMap);
                
                if (processedData.cities.length === 0) {
                    setError("API retornou dados, mas nenhuma cidade foi processada.");
                } else {
                    setData(processedData);
                }

            } catch (err: any) {
                console.error("Erro ao buscar dados da API:", err);
                setError(err.message || "Falha ao carregar dados MapBiomas.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { data, loading, error };
};

// --- HOOK DE DETALHE DE CIDADE (usado no componente Cities) ---
const useCityData = (data: MapBiomasData | null, selectedCity: string) => {
    return useMemo(() => {
        if (!data || !selectedCity) return null;
        
        const city = data.cities.find(c => c.name === selectedCity);
        if (!city) return null;
        
        const latestYear = data.years[data.years.length - 1].toString();
        
        const categoryTotals: any = { totalArea: 0 };
        const timeSeries: any[] = data.years.map(year => ({ year }));

        data.categories.forEach(category => {
            const total = city.metrics[category]?.[latestYear] || 0;
            categoryTotals[category] = total;
            categoryTotals.totalArea += total;
            
            // Preenche a série temporal para o gráfico
            data.years.forEach((year, index) => {
                timeSeries[index][category] = city.metrics[category]?.[year] || 0;
            });
        });

        return {
            city,
            categoryTotals,
            timeSeries,
        };
    }, [data, selectedCity]);
};

// =========================================================================
// 3. COMPONENTE TOOLTIP CUSTOMIZADO PARA RADAR
// =========================================================================

const RadarTooltipContent = ({ active, payload, data, cities, latestYear }: any) => {
    if (active && payload && payload.length) {
        // Encontra o nome da categoria no eixo
        const categoryName = payload[0].payload.category;
        
        return (
            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-sm space-y-1">
                <p className="font-bold text-gray-800 border-b pb-1 mb-1">{categoryName}</p>
                {
                    payload.map((entry: any, index: number) => {
                        // Encontra a cidade correspondente e seu valor real em hectares (ha)
                        const cityName = entry.name;
                        const cityObj = data.cities.find((c: any) => c.name === cityName);
                        
                        // Busca o valor real nos dados brutos
                        const valueInHa = cityObj?.metrics[Object.keys(CATEGORY_LABELS).find(key => CATEGORY_LABELS[key] === categoryName) as CATEGORY_KEYS]?.[latestYear] || 0;

                        return (
                            <div key={cityName} className="flex justify-between items-center" style={{ color: entry.color }}>
                                <span className="font-semibold mr-2">{cityName}:</span>
                                {/* Exibe o valor real (ha) ao lado do valor normalizado (%) */}
                                <span>{formatValue(valueInHa, 'ha')} ({entry.value}%)</span> 
                            </div>
                        );
                    })
                }
            </div>
        );
    }
    return null;
};


// =========================================================================
// 4. COMPONENTE CITIES (VISUALIZAÇÃO PRINCIPAL)
// =========================================================================

const Cities: React.FC = () => {
    const { data, loading, error } = useMapBiomasData();
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const cityData = useCityData(data, selectedCity);

    if (loading) {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-emerald-50 text-emerald-800 z-[998]">
                          <div className="text-center p-8 bg-white rounded-xl shadow-2xl border-2 border-emerald-300">
                              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" />
                              <h2 className="text-xl font-bold">Carregando dados da API...</h2>
                              <p className="text-sm mt-1">Aguarde, unificando informações de MapBiomas e Demografia.</p>
                          </div>
        </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-64 p-6 bg-gray-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
                    <div className="text-red-600 text-lg mb-2">Erro ao carregar dados!</div>
                    <div className="text-gray-600">{error || 'Dados não disponíveis.'}</div>
                </div>
            </div>
        );
    }

    const filteredCities = data.cities.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Preparar dados para comparação radar (Mantido)
    const radarData = data.categories.map(category => {
        const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
        const latestYear = data.years[data.years.length - 1].toString();
        const maxValue = Math.max(...data.cities.map(city => 
            city.metrics[category]?.[latestYear] || 0
        ));
        
        const dataPoint: any = { category: categoryLabel };
        
        data.cities.forEach(city => {
            const value = city.metrics[category]?.[latestYear] || 0;
            dataPoint[city.name] = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
        });
        
        return dataPoint;
    });

    const citiesForRadar = data.cities.map(c => c.name); 

    const getTrendIcon = (direction: string) => {
        if (direction === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (direction === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-500" />;
    };
    
    // As chaves para o LineChart (Trendência Histórica)
    const timeSeriesKeys = [CATEGORY_KEYS.FOREST, CATEGORY_KEYS.URBAN, CATEGORY_KEYS.WATER];

    return (
        <ProtectedRoute>
            <Sidebar />
            <div className="space-y-6 p-6 bg-gray-50 animate-fadeIn min-h-screen pt-24">
                {/* Header */}
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Análise por Cidade</h1>
                    <p className="text-gray-600 text-sm">
                        Explore dados detalhados de uso e cobertura do solo por capital nordestina
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Lista de Cidades (Painel de Navegação) */}
                    <div className="bg-white rounded-xl shadow-lg border p-4 h-full max-h-[85vh] overflow-y-auto">
                        <div className="mb-4 sticky top-0 bg-white pt-2 pb-3 border-b -mx-4 px-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar cidade..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredCities.map((city) => {
                                const latestYear = data.years[data.years.length - 1].toString();
                                const forestArea = city.metrics[CATEGORY_KEYS.FOREST]?.[latestYear] || 0;
                                const urbanArea = city.metrics[CATEGORY_KEYS.URBAN]?.[latestYear] || 0;
                                
                                return (
                                    <div
                                        key={city.name}
                                        onClick={() => setSelectedCity(city.name)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                            selectedCity === city.name
                                                ? 'bg-blue-100 border border-blue-400 shadow-md'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-gray-900">{city.name}</h3>
                                            <span className="text-xs text-white bg-gray-600 px-2 py-0.5 rounded-full">
                                                {getStateAbbreviation(city.estado)}
                                            </span>
                                        </div>
                                        
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div className="flex justify-between">
                                                <span className="flex items-center text-green-700 font-medium">
                                                    <TreePine className="w-3 h-3 mr-1" /> Floresta:
                                                </span>
                                                <span className="font-semibold">{formatValue(forestArea, 'ha')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="flex items-center text-red-700 font-medium">
                                                    <Building2 className="w-3 h-3 mr-1" /> Urbano:
                                                </span>
                                                <span className="font-semibold">{formatValue(urbanArea, 'ha')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Detalhes da Cidade Selecionada */}
                    <div className="lg:col-span-2 space-y-6">
                        {selectedCity && cityData ? (
                            <>
                                {/* Bloco de Métricas Detalhadas */}
                                <div className="bg-white rounded-xl shadow-lg border p-6">
                                    <div className="flex items-center justify-between mb-6 border-b pb-4">
                                        <div>
                                            <h2 className="text-2xl font-extrabold text-gray-900">{cityData.city.name}</h2>
                                            <p className="text-sm text-gray-600 flex items-center mt-1">
                                                <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                                                {cityData.city.estado} • População (IBGE): {cityData.city.ibge_code}
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500 bg-gray-100 p-2 rounded-lg">
                                            Área Total: {formatValue(cityData.categoryTotals.totalArea, 'ha')}
                                        </div>
                                    </div>

                                    {/* Métricas por Categoria (Mini Cards) */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {data.categories.map(category => {
                                            const value = cityData.categoryTotals[category];
                                            const trend = calculateTrend(cityData.timeSeries, category);
                                            const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
                                            
                                            return (
                                                <div key={category} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                    <h4 className="text-xs font-semibold text-gray-700 mb-1">{label}</h4>
                                                    <div className="text-xl font-bold text-gray-900">
                                                        {formatValue(value, 'ha')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                                        <span className={`font-medium mr-1 ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                                                            {getTrendIcon(trend.direction)}
                                                            {trend.percentage.toFixed(1)}%
                                                        </span>
                                                        <span className="text-xs">{trend.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Gráfico de Tendências Line Chart */}
                                <div className="bg-white rounded-xl shadow-lg border p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Evolução Histórica das Categorias Chave
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={cityData.timeSeries}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="year" fontSize={10} stroke="#6B7280" />
                                            <YAxis tickFormatter={(value) => formatValue(Number(value), '')} fontSize={10} stroke="#6B7280" />
                                            <Tooltip 
                                                contentStyle={{ border: '1px solid #D1D5DB' }}
                                                formatter={(value: any, name: string) => [formatValue(Number(value), 'ha'), CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name]}
                                            />
                                            {data.categories.map(category => (
                                                <Line
                                                    key={category}
                                                    type="monotone"
                                                    dataKey={category}
                                                    name={CATEGORY_LABELS[category]}
                                                    stroke={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280'}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : (
                            // Bloco de Seleção Inicial
                            <div className="bg-white rounded-xl shadow-sm border p-12 h-full flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <Globe2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        Inicie a Análise Detalhada
                                    </h3>
                                    <p className="text-gray-600">
                                        Escolha uma capital na lista à esquerda para carregar seus dados históricos e análises específicas de uso do solo.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Comparação Regional (Radar Chart) */}
                <div className="bg-white rounded-xl shadow-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Comparação Regional (Radar) - Situação no último ano
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#E5E7EB" />
                            <PolarAngleAxis dataKey="category" fontSize={12} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                            
                            {citiesForRadar.map((cityName, index) => (
                                <Radar
                                    key={cityName}
                                    name={cityName}
                                    dataKey={cityName}
                                    stroke={Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]}
                                    fill={Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]}
                                    fillOpacity={0.15}
                                    strokeWidth={2}
                                />
                            ))}
                            <Tooltip 
                                content={
                                    <RadarTooltipContent 
                                        data={data} 
                                        cities={citiesForRadar} 
                                        latestYear={data.years[data.years.length - 1]} 
                                    />
                                } 
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ProtectedRoute>

    );
};

export default Cities;