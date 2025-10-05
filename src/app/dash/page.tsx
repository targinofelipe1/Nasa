'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, MapPin, TreePine, Building2, Layers3, Users, Waves, BarChart3, Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import Sidebar from '../components-antigo/Sidebar';



const API_MAPBIOMAS = '/api/sheets?programa=dados-detalhados';
const API_MUNICIPIOS = '/api/sheets?programa=municipios-consolidado'; 

enum MAPBIOMAS_CATEGORIES {
    FOREST = '1. Forest',
    NON_VEGETATED = '4. Non vegetated area',
    FARMING = '3. Farming',
    NON_FOREST_NATURAL = '2. Non Forest Natural Formation',
    WATER = '5. Water and Marine Environment',
}

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
}
interface MapBiomasData {
    metadata: { source: string; };
    years: string[];
    categories: MAPBIOMAS_CATEGORIES[];
    cities: CityData[];
}

const CATEGORY_LABELS = {
    [MAPBIOMAS_CATEGORIES.FOREST]: 'Cobertura Florestal',
    [MAPBIOMAS_CATEGORIES.NON_VEGETATED]: 'Área Urbana/Não Vegetada',
    [MAPBIOMAS_CATEGORIES.FARMING]: 'Agropecuária',
    [MAPBIOMAS_CATEGORIES.NON_FOREST_NATURAL]: 'Outras Formações Naturais',
    [MAPBIOMAS_CATEGORIES.WATER]: 'Água/Ambiente Marinho',
};

const CATEGORY_COLORS = {
    [MAPBIOMAS_CATEGORIES.FOREST]: '#34D399',
    [MAPBIOMAS_CATEGORIES.NON_VEGETATED]: '#F87171',
    [MAPBIOMAS_CATEGORIES.FARMING]: '#FBBF24',
    [MAPBIOMAS_CATEGORIES.NON_FOREST_NATURAL]: '#60A5FA',
    [MAPBIOMAS_CATEGORIES.WATER]: '#38BDF8',
};

const MAPBIOMAS_YEARS_KEYS = Array.from({ length: 39 }, (_, i) => (1985 + i).toString());

const cleanParse = (value: string | undefined): number => {
    if (!value) return 0;
    let cleaned = String(value).trim();
    cleaned = cleaned.replace(/\./g, '');
    cleaned = cleaned.replace(/,/g, '.');
    return parseFloat(cleaned) || 0;
};

const transformMunicipioData = (rawData: SheetRow[]): { [cityName: string]: PopulationMetric } => {
    const populationMap: { [cityName: string]: PopulationMetric } = {};

    rawData.forEach(row => {
        const cityName = row.cidade;
        if (!cityName || populationMap[cityName]) return; 

        const popMetrics: PopulationMetric = {};
        POPULATION_YEARS_COLUMNS.forEach(popColumn => {
            const year = popColumn.match(/\((\d{4})\)/)?.[1];
            const popValue = cleanParse(row[popColumn]); 
            if (year) {
                popMetrics[year] = popValue;
            }
        });
        populationMap[cityName] = popMetrics;
    });

    return populationMap;
};

const transformMapBiomasData = (rawData: SheetRow[], populationMap: { [cityName: string]: PopulationMetric }): MapBiomasData => {
    if (!rawData.length) {
        return { metadata: { source: 'Nenhum dado' }, years: [], categories: [], cities: [] };
    }
    
    const categoriesSet = new Set<string>();
    const citiesMap = new Map<string, CityData>();
    
    const allKeys = new Set(rawData.flatMap(row => Object.keys(row)));
    const validMapBiomasYears = MAPBIOMAS_YEARS_KEYS.filter(year => allKeys.has(year)).sort();

    rawData.forEach(row => {
        const cityName = row.cidade;
        const categoryKey = row.nivel_1; 
        
        if (!cityName) return;

        if (!citiesMap.has(cityName)) {
            citiesMap.set(cityName, {
                name: cityName,
                estado: row.estado,
                metrics: {},
                population: populationMap[cityName] || {},
            });
        }
        const city = citiesMap.get(cityName)!;

        if (categoryKey) {
             categoriesSet.add(categoryKey);

            if (!city.metrics[categoryKey]) {
                city.metrics[categoryKey] = {};
            }

            validMapBiomasYears.forEach(year => {
                const areaValue = cleanParse(row[year]);
                city.metrics[categoryKey][year] = (city.metrics[categoryKey][year] || 0) + areaValue;
            });
        }
    });
    
    const validCategories = Array.from(categoriesSet).filter(cat => Object.values(MAPBIOMAS_CATEGORIES).includes(cat as MAPBIOMAS_CATEGORIES)) as MAPBIOMAS_CATEGORIES[];

    return {
        metadata: { source: 'Dados_Detalhados (API Real)' },
        years: validMapBiomasYears,
        categories: validCategories,
        cities: Array.from(citiesMap.values()),
    };
};

const useDashboardData = () => {
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
                    throw new Error(`Erro HTTP ao buscar dados. Status: MapBiomas ${resMapBiomas.status}, Municípios ${resMunicipios.status}`);
                }

                const resultMapBiomas = await resMapBiomas.json();
                const resultMunicipios = await resMunicipios.json();
                
                const populationMap = transformMunicipioData(resultMunicipios.data as SheetRow[]);
                const processedData = transformMapBiomasData(resultMapBiomas.data as SheetRow[], populationMap);
                
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

    const processedStats = (data: MapBiomasData | null, cityData: CityData[]) => {
        if (!data || cityData.length === 0) return null;

        const latestMapBiomasYear = data.years.slice(-1)[0];
        const prevMapBiomasYear = data.years.length >= 2 ? data.years.slice(-2)[0] : data.years[0];

        const availablePopYears = cityData.flatMap(c => Object.keys(c.population));
        const uniquePopYears = Array.from(new Set(availablePopYears)).sort();
        const latestPopYear = uniquePopYears.slice(-1)[0];
        const prevPopYear = uniquePopYears.length >= 2 ? uniquePopYears.slice(-2)[0] : uniquePopYears[0];

        const calculatedStats: any = {
            latestMapBiomasYear, prevMapBiomasYear,
            latestPopYear, prevPopYear,
            categoryTotals: {}, trends: {}, totalArea: 0, totalPopulationLatest: 0,
        };

        data.categories.forEach(category => {
            let totalLatest = 0;
            let totalPrev = 0;

            cityData.forEach(city => {
                totalLatest += city.metrics[category]?.[latestMapBiomasYear] || 0;
                totalPrev += city.metrics[category]?.[prevMapBiomasYear] || 0;
            });

            calculatedStats.categoryTotals[category] = totalLatest;
            calculatedStats.totalArea += totalLatest;

            const change = totalLatest - totalPrev;
            const changePercent = totalPrev > 0 ? (change / totalPrev) * 100 : 0;
            const trend = change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';
            
            calculatedStats.trends[category] = { trend, changePercent: changePercent };
        });

        const compositionData: any[] = data.years.map(year => {
            const entry: any = { year };
            data.categories.forEach(category => {
                let yearTotal = 0;
                cityData.forEach(city => {
                    yearTotal += city.metrics[category]?.[year] || 0;
                });
                entry[category] = yearTotal;
            });
            return entry;
        });
        calculatedStats.compositionData = compositionData;

        const populationTimeSeries: any[] = uniquePopYears.map(year => {
            let totalPop = 0;
            cityData.forEach(city => {
                totalPop += city.population[year] || 0;
            });
            return { year, population: totalPop };
        });
        calculatedStats.populationTimeSeries = populationTimeSeries;
        
        calculatedStats.totalPopulationLatest = populationTimeSeries.find((d: any) => d.year === latestPopYear)?.population || 0;
        const totalPopulationPrev = populationTimeSeries.find((d: any) => d.year === prevPopYear)?.population || 0;

        const popChange = calculatedStats.totalPopulationLatest - totalPopulationPrev;
        const popChangePercent = totalPopulationPrev > 0 ? (popChange / totalPopulationPrev) * 100 : 0;
        const popTrend = popChange > 0 ? 'up' : popChange < 0 ? 'down' : 'stable';

        calculatedStats.populationTrend = { direction: popTrend, percentage: Math.abs(popChangePercent), label: `Variação vs. ${prevPopYear}` };

        calculatedStats.growthComparisonData = data.categories.map(category => {
            const trend = calculatedStats.trends[category];
            const latestValue = calculatedStats.categoryTotals[category];
            const prevValue = latestValue / (1 + (trend.changePercent / 100));
            const net_change = latestValue - prevValue;
            
            return {
                category: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
                net_change: net_change
            };
        });

        return calculatedStats;
    };

    return { data, processedStats, loading, error };
};


const MetricCard: React.FC<any> = ({ title, value, unit, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
        <div className="flex justify-between items-start">
            <h4 className="text-sm font-semibold text-gray-500">{title}</h4>
            <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        <div className="mt-2 text-3xl font-bold text-gray-900">{value} {unit}</div>
        <div className="text-sm text-gray-500 mt-1 flex items-center">
            <span className={`font-semibold mr-1 ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                {trend.percentage > 0 ? `+${trend.percentage.toFixed(1)}%` : trend.percentage < 0 ? `-${trend.percentage.toFixed(1)}%` : '0%'}
            </span>
            <span>{trend.label}</span>
        </div>
    </div>
);

const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
};

const formatValue = (value: number, unit: string = 'ha') => {
    if (value === 0) return "0";
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
};


const Dashboard: React.FC = () => {
    const { data, processedStats, loading, error } = useDashboardData();
    const [selectedCity, setSelectedCity] = useState<string | 'all'>('all');
    const [selectedState, setSelectedState] = useState<string | 'all'>('all');

    const filteredCities = useMemo(() => {
        if (!data) return [];
        let cities = data.cities;

        if (selectedState !== 'all') {
            cities = cities.filter(city => city.estado === selectedState);
        }
        if (selectedCity !== 'all') {
            cities = cities.filter(city => city.name === selectedCity);
        }
        return cities;
    }, [data, selectedCity, selectedState]);

    const stats = processedStats(data, filteredCities);
    
    const statesList = useMemo(() => {
        if (!data) return [];
        const uniqueStates = new Set(data.cities.map(c => c.estado));
        return Array.from(uniqueStates).sort();
    }, [data]);

    const citiesList = useMemo(() => {
        if (!data) return [];
        let cities = data.cities;
        if (selectedState !== 'all') {
             cities = cities.filter(city => city.estado === selectedState);
        }
        return cities.map(c => c.name).sort();
    }, [data, selectedState]);


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
    if (error || !data || !stats) {
        return (
            <div className="flex items-center justify-center h-64 p-6 bg-gray-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
                    <div className="text-red-600 text-lg font-bold mb-2">Erro ao carregar dados!</div>
                    <div className="text-gray-600 text-sm">{error || 'Dados não disponíveis. Verifique a API e o formato dos dados.'}</div>
                </div>
            </div>
        );
    }

    const titleSuffix = selectedCity === 'all' ? (selectedState === 'all' ? '(Total Nordeste)' : `(Total ${selectedState})`) : `(${selectedCity} - ${selectedState})`;
    
    const growthComparisonData = stats.growthComparisonData.map((d: any) => ({
        ...d,
        plot_value: d.net_change,
        is_positive: d.net_change >= 0,
    }));


    return (
        <ProtectedRoute>
        <Sidebar />

        <div className="space-y-8 p-6 bg-gray-50 min-h-screen font-sans">
            
           {/* Header, Título e Filtros */}
<div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-24">
  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
    Monitoramento Detalhado: MapBiomas & Demografia {titleSuffix}
  </h1>
  <p className="text-gray-600 mb-4">
    Análise da evolução do uso do solo ({stats.latestMapBiomasYear}) e da
    População ({stats.latestPopYear}).
  </p>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Filtro de Estado */}
    <div className="flex flex-col">
      <label
        htmlFor="state-filter"
        className="text-sm font-medium text-gray-700 mb-1"
      >
        Filtrar por Estado:
      </label>
      <select
        id="state-filter"
        value={selectedState}
        onChange={(e) => {
          setSelectedState(e.target.value);
          setSelectedCity("all");
        }}
        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
      >
        <option value="all">Todos os Estados</option>
        {statesList.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
    </div>

    {/* Filtro de Cidade */}
    <div className="flex flex-col">
      <label
        htmlFor="city-filter"
        className="text-sm font-medium text-gray-700 mb-1"
      >
        Filtrar por Cidade:
      </label>
      <select
        id="city-filter"
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
        disabled={selectedState === "all" || citiesList.length === 0}
        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm disabled:bg-gray-100 transition"
      >
        <option value="all">
          Todas as Cidades ({filteredCities.length})
        </option>
        {citiesList.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>

            {/* Indicador de Dados */}
        <div className="flex flex-col justify-end md:col-span-2">
        <div className="bg-[#0277BD] text-white font-bold py-2 px-4 rounded-lg text-center shadow-md">
                Cidades Analisadas: {filteredCities.length} de {data.cities.length}
        </div>
            </div>
        </div>
        </div>


            {/* Seção 1: Métricas Chave (MapBiomas + População) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                
                <MetricCard
                    title={`População Total (${stats.latestPopYear})`}
                    value={stats.totalPopulationLatest.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    unit="pessoas"
                    icon={Users}
                    color="indigo"
                    trend={stats.populationTrend}
                />
                <MetricCard
                    title={`Área Total (${stats.latestMapBiomasYear})`}
                    value={formatValue(stats.totalArea, 'ha')}
                    unit="ha"
                    icon={Layers3}
                    color="purple"
                    trend={{ direction: 'stable', percentage: 0, label: 'Área monitorada' }}
                />
                
                <MetricCard
                    title={`Total Florestal`}
                    value={formatValue(stats.categoryTotals[MAPBIOMAS_CATEGORIES.FOREST] || 0, 'ha')}
                    unit="ha"
                    icon={TreePine}
                    color="green"
                    trend={{
                        direction: stats.trends[MAPBIOMAS_CATEGORIES.FOREST]?.trend,
                        percentage: Math.abs(stats.trends[MAPBIOMAS_CATEGORIES.FOREST]?.changePercent || 0),
                        label: `Variação vs. ${stats.prevMapBiomasYear}`
                    }}
                />

                <MetricCard
                    title={`Total Urbano`}
                    value={formatValue(stats.categoryTotals[MAPBIOMAS_CATEGORIES.NON_VEGETATED] || 0, 'ha')}
                    unit="ha"
                    icon={Building2}
                    color="red"
                    trend={{
                        direction: stats.trends[MAPBIOMAS_CATEGORIES.NON_VEGETATED]?.trend,
                        percentage: Math.abs(stats.trends[MAPBIOMAS_CATEGORIES.NON_VEGETATED]?.changePercent || 0),
                        label: `Variação vs. ${stats.prevMapBiomasYear}`
                    }}
                />
            </div>

            {/* Seção 2: Gráficos de Evolução */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Evolução da Composição do Uso do Solo (Área Empilhada) */}
                <div className="bg-white p-6 rounded-xl shadow-md border hover-lift lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Evolução da Composição do Uso do Solo {titleSuffix}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.compositionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="year" fontSize={12} stroke="#6B7280" />
                            <YAxis 
                                tickFormatter={(value) => formatValue(Number(value), 'ha')} 
                                stroke="#6B7280"
                                fontSize={12}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                formatter={(value: any, name: string) => [`${formatValue(Number(value))} ha`, CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name]}
                            />
                            {[
                                MAPBIOMAS_CATEGORIES.FOREST,
                                MAPBIOMAS_CATEGORIES.NON_VEGETATED,
                                MAPBIOMAS_CATEGORIES.FARMING,
                                MAPBIOMAS_CATEGORIES.NON_FOREST_NATURAL,
                                MAPBIOMAS_CATEGORIES.WATER,
                            ].map(category => (
                                <Area
                                    key={category}
                                    type="monotone"
                                    dataKey={category}
                                    stackId="1"
                                    name={CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                                    stroke={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280'}
                                    fill={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280'}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Evolução da População (Gráfico de Linha) */}
                 <div className="bg-white p-6 rounded-xl shadow-md border hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Evolução da População Residente {titleSuffix}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.populationTimeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="year" fontSize={12} stroke="#6B7280" />
                            <YAxis 
                                tickFormatter={(value) => formatValue(Number(value), 'pessoas')}
                                stroke="#6B7280"
                                fontSize={12}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                formatter={(value: any) => [`${value.toLocaleString('pt-BR')} pessoas`, 'População Total']}
                            />
                            <Line
                                type="monotone"
                                dataKey="population"
                                name="População Total"
                                stroke="#4F46E5"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Seção 3: Novo Gráfico de Composição de Crescimento/Redução e Tendências Chave */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 3. GRÁFICO CORRIGIDO: Comparação de Crescimento vs. Redução */}
                <div className="bg-white p-6 rounded-xl shadow-md border hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Composição do Crescimento/Redução {titleSuffix} ({stats.prevMapBiomasYear} - {stats.latestMapBiomasYear})
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={growthComparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
                            <YAxis tickFormatter={(value) => formatValue(Number(value), 'ha')} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                formatter={(value: any) => [`${formatValue(Number(value))} ha`, 'Mudança Líquida']}
                            />
                            <Bar 
                                dataKey="plot_value" 
                                name="Mudança Líquida"
                                radius={[4, 4, 0, 0]}
                            >
                                {/* Lógica para colorir a barra: Verde para Crescimento (>=0), Vermelho para Redução (<0) */}
                                {growthComparisonData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.is_positive ? '#10B981' : '#EF4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-500 mt-2">Área (em ha) perdida (vermelho) ou ganha (verde) entre os dois últimos anos de MapBiomas.</p>
                </div>
                
                {/* 4. Tendências (MapBiomas Linha) */}
                <div className="bg-white p-6 rounded-xl shadow-md border hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tendência de Categorias Chave (Floresta, Agropecuária, Urbana) {titleSuffix}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.compositionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="year" fontSize={12} stroke="#6B7280" />
                            <YAxis 
                                tickFormatter={(value) => formatValue(Number(value), 'ha')}
                                stroke="#6B7280"
                                fontSize={12}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px' }}
                                formatter={(value: any, name: string) => [`${formatValue(Number(value))} ha`, CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name]}
                            />
                            <Line type="monotone" dataKey={MAPBIOMAS_CATEGORIES.FOREST} name={CATEGORY_LABELS[MAPBIOMAS_CATEGORIES.FOREST]} stroke={CATEGORY_COLORS[MAPBIOMAS_CATEGORIES.FOREST]} strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey={MAPBIOMAS_CATEGORIES.FARMING} name={CATEGORY_LABELS[MAPBIOMAS_CATEGORIES.FARMING]} stroke={CATEGORY_COLORS[MAPBIOMAS_CATEGORIES.FARMING]} strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey={MAPBIOMAS_CATEGORIES.NON_VEGETATED} name={CATEGORY_LABELS[MAPBIOMAS_CATEGORIES.NON_VEGETATED]} stroke={CATEGORY_COLORS[MAPBIOMAS_CATEGORIES.NON_VEGETATED]} strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Seção 4: Variação Detalhada por Categoria (Mini Cards) */}
            <div className="bg-white p-6 rounded-xl shadow-md border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Variação por Categoria {titleSuffix} (Área em {stats.latestMapBiomasYear})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {data.categories.map(category => {
                        const trend = stats.trends[category];
                        const total = stats.categoryTotals[category];
                        const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
                        const colorClass = trend?.trend === 'increasing' ? 'text-green-600' : trend?.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600';
                        
                        return (
                            <div key={category} className="p-3 border rounded-xl bg-gray-50 flex flex-col justify-between shadow-sm">
                                <div className="text-sm font-medium text-gray-600 truncate">{label}</div>
                                <div className="text-xl font-bold text-gray-900 my-1">{formatValue(total, 'ha')} ha</div>
                                <div className="flex items-center text-sm">
                                    <span className={`font-semibold mr-1 ${colorClass}`}>
                                        {trend?.changePercent ? `${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%` : '0%'}
                                    </span>
                                    {getTrendIcon(trend?.trend || 'stable')}
                                    <span className="text-gray-500 ml-1 hidden sm:inline">({stats.prevMapBiomasYear})</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </ProtectedRoute>
    );
};

export default Dashboard;