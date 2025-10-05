'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Users, Layers3, TrendingUp, TrendingDown, Minus, Clock, Zap, Target, Leaf, DollarSign, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import Sidebar from '../components-antigo/Sidebar';
const ProtectedRoute = ({ children }: any) => <>{children}</>;

const API_MAPBIOMAS = '/api/sheets?programa=dados-detalhados';
const API_MUNICIPIOS = '/api/sheets?programa=municipios-consolidado'; 

enum CATEGORY_KEYS { 
    FOREST = '1. Forest', 
    URBAN = '4. Non vegetated area', 
    WATER = '5. Water and Marine Environment',
    FARMING = '3. Farming',
    NON_FOREST_NATURAL = '2. Non Forest Natural Formation',
    NOT_OBSERVED = '6. Not Observed',
}
const CATEGORY_LABELS: { [key: string]: string } = { 
    [CATEGORY_KEYS.FOREST]: 'Floresta', 
    [CATEGORY_KEYS.URBAN]: 'Área Não Vegetada', 
    [CATEGORY_KEYS.WATER]: 'Ambiente Aquático',
    [CATEGORY_KEYS.FARMING]: 'Agropecuária',
    [CATEGORY_KEYS.NON_FOREST_NATURAL]: 'Formação Natural',
    [CATEGORY_KEYS.NOT_OBSERVED]: 'Não Observado',
};
const CATEGORY_COLORS: { [key: string]: string } = { 
    [CATEGORY_KEYS.FOREST]: '#34D399', 
    [CATEGORY_KEYS.URBAN]: '#F87171', 
    [CATEGORY_KEYS.WATER]: '#38BDF8',
    [CATEGORY_KEYS.FARMING]: '#FBBF24',
    [CATEGORY_KEYS.NON_FOREST_NATURAL]: '#60A5FA',
    [CATEGORY_KEYS.NOT_OBSERVED]: '#9CA3AF',
};

const POPULATION_YEARS_COLUMNS = [
    'População (1985)', 'População (1991)', 'População (2000)',
    'População (2010)', 'População (2022)', 'População (2024)',
];

interface SheetRow { [key: string]: string | undefined; cidade: string; estado: string; nivel_1: string; }
interface CityMetric { [year: string]: number; }
interface PopulationMetric { [year: string]: number; }
interface CityData { name: string; estado: string; metrics: { [category: string]: CityMetric; }; population: PopulationMetric; ibge_code: string; }
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
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
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
const getTrendIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (direction === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
};
// ------------------------------------------------------------------

const transformMunicipioData = (rawData: SheetRow[]): { [cityName: string]: Partial<CityData> } => {
    const municipioMap: { [cityName: string]: Partial<CityData> } = {};
    rawData.forEach(row => {
        const cityName = row.cidade;
        if (!cityName || municipioMap[cityName]) return; 
        const popMetrics: PopulationMetric = {};
        POPULATION_YEARS_COLUMNS.forEach(popColumn => {
            const year = popColumn.match(/\((\d{4})\)/)?.[1];
            const popValue = cleanParse(row[popColumn]); 
            if (year) popMetrics[year] = popValue;
        });
        municipioMap[cityName] = { population: popMetrics, ibge_code: row.codigo_ibge || 'N/A', estado: row.estado };
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
                name: cityName, estado: row.estado || municipioDetail.estado || 'N/A',
                ibge_code: municipioDetail.ibge_code || 'N/A', metrics: {}, population: municipioDetail.population || {},
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
        years: validMapBiomasYears, categories: validCategories, cities: Array.from(citiesMap.values()),
    };
};

const useMapBiomasData = () => {
    const [data, setData] = useState<MapBiomasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMapBiomas, resMunicipios] = await Promise.all([fetch(API_MAPBIOMAS), fetch(API_MUNICIPIOS)]);
                if (!resMapBiomas.ok || !resMunicipios.ok) throw new Error(`Erro HTTP: Falha ao buscar uma ou ambas as fontes.`);
                const resultMapBiomas = await resMapBiomas.json();
                const resultMunicipios = await resMunicipios.json();
                const municipioMap = transformMunicipioData(resultMunicipios.data as SheetRow[]);
                const processedData = transformMapBiomasData(resultMapBiomas.data as SheetRow[], municipioMap);
                if (processedData.cities.length === 0) setError("API retornou dados, mas nenhuma cidade foi processada.");
                else setData(processedData);
            } catch (err: any) {
                setError(err.message || "Falha ao carregar dados MapBiomas.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    return { data, loading, error };
};

const calculateMetricStats = (data: MapBiomasData | null, selectedCities: CityData[]) => {
    if (!data || selectedCities.length === 0) return null;

    const latestYear = data.years.slice(-1)[0];
    const prevYear = data.years.length >= 2 ? data.years.slice(-2)[0] : data.years[0];

    const stats: any = { categoryMetrics: {}, totalArea: 0, latestYear, prevYear };
    const seriesData: any[] = data.years.map(year => ({ year }));
    let totalForestArea = 0;
    let totalUrbanArea = 0;

    data.categories.forEach(category => {
        let totalLatest = 0;
        let totalPrev = 0;

        selectedCities.forEach(city => {
            totalLatest += city.metrics[category]?.[latestYear] || 0;
            totalPrev += city.metrics[category]?.[prevYear] || 0;

            data.years.forEach((year, index) => {
                seriesData[index][category] = (seriesData[index][category] || 0) + (city.metrics[category]?.[year] || 0);
            });
        });

        const change = totalLatest - totalPrev;
        const changePercent = totalPrev > 0 ? (change / totalPrev) * 100 : 0;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
        
        stats.categoryMetrics[category] = { value: totalLatest, trend, changePercent: Math.abs(changePercent) };
        stats.totalArea += totalLatest;

        if (category === CATEGORY_KEYS.FOREST) totalForestArea = totalLatest;
        if (category === CATEGORY_KEYS.URBAN) totalUrbanArea = totalLatest;
    });

    const forestTrend = stats.categoryMetrics[CATEGORY_KEYS.FOREST];
    
    stats.taxaMudanca = {
        value: forestTrend.changePercent * (forestTrend.trend === 'down' ? -1 : 1),
        trend: forestTrend.trend,
        label: `Variação anual da cobertura florestal`
    };

    stats.indiceSustentabilidade = {
        score: Math.round(80 + (totalForestArea / stats.totalArea) * 20),
        trend: totalForestArea > totalUrbanArea ? 'up' : 'down'
    };

    stats.totalForestArea = totalForestArea;
    stats.seriesData = seriesData;
    
    const popYears = selectedCities.flatMap(c => Object.keys(c.population)).sort();
    const uniquePopYears = Array.from(new Set(popYears)).sort();

    stats.populationSeries = uniquePopYears.map(year => {
        const totalPop = selectedCities.reduce((sum, city) => sum + (city.population[year] || 0), 0);
        return { year, population: totalPop };
    }).filter(d => d.population > 0);

    stats.areaSeries = data.years.map(year => {
        const totalArea = selectedCities.reduce((sum, city) => {
            return sum + data.categories.reduce((catSum, category) => {
                return catSum + (city.metrics[category]?.[year] || 0);
            }, 0);
        }, 0);
        return { year, area: totalArea };
    }).filter(d => d.area > 0);

    return stats;
};


const MetricCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => {
    const trendDirection = trend?.value < 0 ? 'down' : trend?.value > 0 ? 'up' : 'stable';
    const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg transition duration-200">
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-gray-500">{title}</h4>
                <Icon className={`w-5 h-5 text-${color}-500`} />
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center">
                {trend && (
                    <span className={`font-medium mr-1 flex items-center ${trend.value < 0 ? 'text-red-600' : trend.value > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        <TrendIcon className="w-3 h-3 mr-0.5" />
                        {trend.value.toFixed(2)}% {subtext}
                    </span>
                )}
                {!trend && <span className="text-sm text-gray-600">{subtext}</span>}
            </div>
        </div>
    );
};

const Metrics: React.FC = () => {
    const { data, loading, error } = useMapBiomasData();
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredCitiesList = data?.cities.filter((city: CityData) =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.estado.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const selectedCityObjects = data?.cities.filter((city: CityData) => selectedCities.includes(city.name)) || [];
    const stats = calculateMetricStats(data, selectedCityObjects);

    useEffect(() => {
        if (data && selectedCities.length === 0) {
            setSelectedCities(data.cities.map((c: CityData) => c.name));
        }
    }, [data]);


    if (loading) {
        return  <div className="fixed inset-0 flex items-center justify-center bg-emerald-50 text-emerald-800 z-[998]">
                                  <div className="text-center p-8 bg-white rounded-xl shadow-2xl border-2 border-emerald-300">
                                      <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" />
                                      <h2 className="text-xl font-bold">Carregando dados da API...</h2>
                                      <p className="text-sm mt-1">Aguarde, unificando informações de MapBiomas e Demografia.</p>
                                  </div>
                </div>
    }

    if (error || !data || !stats) {
        return <div className="p-6 text-red-500">Erro ao carregar métricas ou dados insuficientes.</div>;
    }
    
    const isAllSelected = selectedCities.length === data.cities.length;
    const chartTitleSuffix = selectedCities.length === data.cities.length ? '(Total Nordeste)' : `(${selectedCities.join(', ')})`;
    const latestYear = stats.latestYear;
    const prevYear = stats.prevYear;


    return (
        <ProtectedRoute>
            <Sidebar />
            <div className="space-y-6 p-6 bg-gray-50 animate-fadeIn min-h-screen pt-24">
                
                <div className="bg-white p-4 rounded-xl shadow-lg border flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Análise de Métricas {chartTitleSuffix}</h1>
                    <div className="text-sm text-gray-600 flex items-center space-x-3">
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border p-4 max-h-[85vh] overflow-y-auto">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" /> Selecionar Cidades
                        </h3>
                        
                        
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Filtrar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-1.5 border rounded-lg text-sm"
                            />
                        </div>

                        {filteredCitiesList.map((city: CityData) => (
                            <div
                                key={city.name}
                                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                    if (selectedCities.length === 1 && selectedCities.includes(city.name)) {
                                        return; 
                                    }
                                    setSelectedCities(prev => 
                                        prev.includes(city.name) 
                                            ? prev.filter(n => n !== city.name) 
                                            : [...prev, city.name]
                                    );
                                }}
                            >
                                <span className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedCities.includes(city.name)}
                                        readOnly
                                        className="mr-2"
                                    />
                                    {city.name}
                                </span>
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                                    {getStateAbbreviation(city.estado)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-3 space-y-6">

                        {/* Linha de Métricas Chave (Top Row da Imagem) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <MetricCard
                                title="Conservação Florestal"
                                value={`${(stats.totalForestArea / stats.totalArea * 100).toFixed(1)}%`}
                                subtext="Percentual de cobertura florestal total"
                                icon={Leaf}
                                color="green"
                                trend={{ value: 0, direction: 'stable' }}
                            />
                            
                            <MetricCard
                                title="Taxa de Mudança"
                                value={`${stats.taxaMudanca.value.toFixed(2)}%`}
                                subtext={stats.taxaMudanca.label}
                                icon={Clock}
                                color={stats.taxaMudanca.trend === 'down' ? 'red' : 'orange'}
                                trend={{ value: stats.taxaMudanca.value, direction: stats.taxaMudanca.trend }}
                            />

                            <MetricCard
                                title="Índice de Sustentabilidade"
                                value={`${stats.indiceSustentabilidade.score}`}
                                subtext="Score baseado em múltiplos indicadores"
                                icon={Zap}
                                color="blue"
                                trend={{ value: 0, direction: stats.indiceSustentabilidade.trend }}
                            />
                        </div>

                        {/* Linha de Métricas por Categoria (Meio da Imagem) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {
                                [CATEGORY_KEYS.FOREST, CATEGORY_KEYS.NON_FOREST_NATURAL, CATEGORY_KEYS.FARMING, CATEGORY_KEYS.URBAN, CATEGORY_KEYS.WATER, CATEGORY_KEYS.NOT_OBSERVED].map((category) => {
                                    const metric = stats.categoryMetrics[category];
                                    const label = CATEGORY_LABELS[category];
                                    
                                    if (!metric) return null; 

                                    return (
                                        <div key={category} className="bg-white p-4 rounded-xl shadow-md border flex flex-col justify-between">
                                            <h4 className="text-sm font-semibold text-gray-500">{label}</h4>
                                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                                {formatValue(metric.value, 'ha')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                <span className={`font-medium mr-1 flex items-center ${metric.trend === 'down' ? 'text-red-600' : metric.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {getTrendIcon(metric.trend)}
                                                    {metric.changePercent.toFixed(1)}% 
                                                </span>
                                                <span className="text-xs">vs {prevYear}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        {/* Gráfico 1: Evolução da População */}
                        <div className="bg-white rounded-xl shadow-lg border p-6 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Users className="w-4 h-4 mr-2 text-indigo-500" /> Evolução Demográfica {chartTitleSuffix}
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats.populationSeries}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="year" fontSize={10} />
                                    <YAxis tickFormatter={(value) => formatValue(Number(value), 'p')} fontSize={10} />
                                    <Tooltip formatter={(value: any) => [formatValue(Number(value), 'pessoas'), 'População']} />
                                    <Line type="monotone" dataKey="population" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-gray-500 mt-2">
                               Mostra a evolução da população agregada nos anos de censo disponíveis.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Metrics;