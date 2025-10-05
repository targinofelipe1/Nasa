'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import Sidebar from '../components-antigo/Sidebar';
import { Search, MapPin, TrendingUp, TrendingDown, Minus, Layers3, Users, TreePine, Building2, Globe2, Loader2, HeartHandshake, Home, Scale, Recycle, Car, Venus, CloudSun, Navigation } from 'lucide-react';

// --- CONSTANTES (Mantidas) ---
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

interface GeoFaunaData {
    posicaoSolar: string; 
    solos: string;
    direcaoVentos: string;
    faunaFlora: string;
}

interface GeoData {
    sunDirection: { nascer: string; pôr: string; };
    solos: string;
}


interface CustomTableData {
    header: string[];
    rows: (string | number)[][];
}

interface CustomCityContent {
    title: string;
    text: string;
    table: CustomTableData;
}

interface ClimateData {
    maxMed: { anual: string; quente: string; frio: string; };
    minMed: { anual: string; quente: string; frio: string; };
    umidade: { anual: string; quente: string; frio: string; };
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

const DADOS_GEO_FAUNA_POR_CIDADE: { [city: string]: GeoFaunaData } = {
    'João Pessoa': {
        posicaoSolar: 'Predominante no quadrante Leste (nascente) e Oeste (poente) ',
        solos: 'Argissolos, Neossolos e Latossolos',
        direcaoVentos: 'Sudeste (SE) e Leste (E), constantes (brisa marinha)',
        faunaFlora: 'Mata Atlântica (Restinga e Tabuleiros Costeiros), com presença de saguis e aves costeiras.',
    },
    'Fortaleza': {
        posicaoSolar: 'Variação menor na inclinação solar anual (zona equatorial)',
        solos: 'Areias quartzosas marinhas e Neossolos (mais secos)',
        direcaoVentos: 'Predominante para Leste (E), ventos fortes e regulares',
        faunaFlora: 'Caatinga Litorânea e Manguezais. Fauna marinha e pouca mata de grande porte.',
    },
    'Recife': {
        posicaoSolar: 'Alta incidência de sol na maior parte do ano',
        solos: 'Solos aluviais e Gleissolos em áreas de várzea e mangue',
        direcaoVentos: 'Sudeste (SE), com maior velocidade nos meses de seca',
        faunaFlora: 'Manguezais críticos e remanescentes de Mata Atlântica (principalmente na Zona da Mata Norte).',
    },
    'Natal': {
        posicaoSolar: 'Posição direta, com dias longos e pouca variação sazonal',
        solos: 'Neossolos e Latossolos Amarelos (dunas e tabuleiros)',
        direcaoVentos: 'Leste (E) e Sudeste (SE), essencial para os ventos de dunas',
        faunaFlora: 'Vegetação de Dunas e Restinga, com proteção em áreas de Preservação Ambiental.',
    },
    'Salvador': {
        posicaoSolar: 'Trajetória Leste-Oeste, tipica de zonas tropicais',
        solos: 'Argissolos e Latossolos, com intensa degradação urbana',
        direcaoVentos: 'Leste (E) e Nordeste (NE), influenciando a temperatura da Baía',
        faunaFlora: 'Mata Atlântica costeira (remanescentes fragmentados) e vida marinha da Baía de Todos os Santos.',
    },
};

const DADOS_CUSTOMIZADOS_CIDADE: { [city: string]: CustomCityContent } = {
    'João Pessoa': {
        title: 'Análise Detalhada: Expansão Urbana de João Pessoa (1985 à 2023)',
        text: 'O crescimento da mancha urbana em João Pessoa tem se concentrado na área leste, pressionando a vegetação de restinga e gerando debates sobre o alinhamento de obras na orla, o que afeta diretamente o ODS 11 (Cidades Sustentáveis) e ODS 15 (Vida Terrestre). O monitoramento da ocupação é crucial.',
        table: {
            header: ['Indicador', 'Vegetação Passada','Vegetação Atual'],
            rows: [
                ['Aumento % Área Urbana (36 anos)','7,4%', '+9,7%'],
                ['Área de Restinga Perdida', '9 mil ha', '-9 mil ha'],
              
            ]
        }
    },
    'Fortaleza': {
    title: 'Análise Ambiental e Urbana: Crescimento e Pressões Ambientais (Fortaleza)',
    text: 'Fortaleza apresenta um crescimento urbano intenso, semelhante ao de Natal, com elevada densidade demográfica e forte concentração populacional em áreas urbanas. O avanço da urbanização e a redução florestal nas últimas décadas refletem desafios críticos para o planejamento sustentável e o equilíbrio ecológico regional.',
    table: {
        header: ['Indicador Urbano-Ambiental', 'Valor', 'Observação'],
        rows: [
            ['Taxa de Crescimento Urbano', '3,62% ao ano', '16% de aumento total; 77% da área é urbana'],
            ['Redução Florestal', '0,34 ha médios/ano (1985–2020)', 'Ganho agropecuário em Pentecoste (CE) >3200%; risco de desertificação']
        ]
    }
},
    'Recife': {
    title: 'Análise Ambiental: Mata Atlântica e Áreas de Risco (Recife)',
    text: 'Recife apresenta uma expansão expressiva das áreas de Mata Atlântica em zonas de risco, com elevada pressão antrópica e perda significativa de cobertura vegetal ao longo das últimas décadas. A situação reflete desafios críticos para a conservação da biodiversidade e o equilíbrio ecológico urbano.',
    table: {
        header: ['Indicador Ambiental', 'Valor', 'Observação'],
        rows: [
            ['Área Verde Total', '578 ha', '60% com uso antropogênico'],
            ['Perda de Mata Atlântica', '2.000 ha em 39 anos', 'Redução de 7,2% da fauna e bioma; +297% em áreas de risco']
        ]
    }
},
    'Natal': {
    title: 'Análise Ambiental: Crescimento Urbano e Vegetação Savanícola (Natal)',
    text: 'Natal destaca-se pelo intenso crescimento urbano nas últimas décadas, o que tem ampliado a pressão sobre seus ecossistemas naturais. O bioma savânico, predominante na região, apresenta perdas significativas de vegetação nativa, refletindo o avanço da urbanização e as transformações no uso do solo.',
    table: {
        header: ['Indicador Ambiental', 'Valor', 'Observação'],
        rows: [
            ['Crescimento Urbano', '>16% (último censo)', 'Entre os maiores da região Nordeste'],
            ['Perda de Vegetação Nativa', '3,7 mil ha (10%)', 'Formação savânica; 230 mil ha de cobertura no RN']
        ]
    }
},
    'Salvador': {
    title: 'Análise Ambiental e Urbana: Expansão e Vulnerabilidade Territorial (Salvador)',
    text: 'Salvador apresenta um crescimento urbano acelerado, acompanhado por desafios socioambientais expressivos. A expansão em áreas de risco e a perda contínua da vegetação nativa da Mata Atlântica evidenciam a pressão sobre o bioma e a necessidade de estratégias de adaptação urbana e ambiental sustentáveis.',
    table: {
        header: ['Indicador Urbano-Ambiental', 'Valor', 'Observação'],
        rows: [
            ['Crescimento de Área Urbana', '16%', '30% das construções em áreas de risco; +5 mil decréscimos de favelas (2024)'],
            ['Perda de Vegetação Nativa', '3,7 mil ha (≈10%)', 'Crescimento de 3,3% em encostas (>30% de declividade); forte relevo ondulado']
        ]
    }
},
};

const DADOS_CLIMATICOS_POR_CIDADE: { [city: string]: ClimateData } = {
    'João Pessoa': {
        maxMed: { anual: '30°C', quente: '31°C', frio: '28°C' },
        minMed: { anual: '23,9°C', quente: '25°C', frio: '21°C' },
        umidade: { anual: '76%', quente: '82%', frio: '72%' },
    },
    'Fortaleza': {
        maxMed: { anual: '30,8°C', quente: '32°C', frio: '29°C' },
        minMed: { anual: '24,2°C', quente: '25°C', frio: '23°C' },
        umidade: { anual: '79%', quente: '85%', frio: '74%' },
    },
    'Natal': {
        maxMed: { anual: '29,5°C', quente: '31°C', frio: '28°C' },
        minMed: { anual: '23,5°C', quente: '24°C', frio: '22°C' },
        umidade: { anual: '78%', quente: '80%', frio: '75%' },
    },
    'Recife': {
        maxMed: { anual: '29,3°C', quente: '30°C', frio: '28°C' },
        minMed: { anual: '23,4°C', quente: '24°C', frio: '22°C' },
        umidade: { anual: '81%', quente: '84%', frio: '78%' },
    },
    'Salvador': {
        maxMed: { anual: '28,5°C', quente: '30°C', frio: '27°C' },
        minMed: { anual: '23,0°C', quente: '24°C', frio: '21°C' },
        umidade: { anual: '80%', quente: '85%', frio: '75%' },
    },
};


const ODS_CRITICAS_POR_CIDADE: { [city: string]: { id: number; title: string; description: string; icon: any; status: string; color: string; textColor: string; bgColor: string; metric: string; metricValue: string; }[] } = {
    'João Pessoa': [
        { 
            id: 5, 
            title: 'ODS 5: Igualdade de Gênero', 
            description: 'Necessidade de eliminar a violência de gênero e aumentar a participação política feminina.', 
            icon: Venus, 
            status: 'Abaixo da Média',
            color: 'bg-red-600',
            textColor: 'text-red-800',
            bgColor: 'bg-red-100',
            metric: 'Violência contra Mulheres (Taxa/100k)',
            metricValue: '5.2/100k',
        },
        { 
            id: 11, 
            title: 'ODS 11: Comunidades Sustentáveis', 
            description: 'Desafios no saneamento básico e crescimento urbano desordenado, especialmente na orla.', 
            icon: Building2, 
            status: 'Preocupa',
            color: 'bg-orange-600',
            textColor: 'text-orange-800',
            bgColor: 'bg-orange-100',
            metric: 'Saneamento Básico (Acesso)',
            metricValue: '68% (Nacional: 75%)',
        },
        { 
            id: 15, 
            title: 'ODS 15: Proteger a Vida Terrestre', 
            description: 'Alto índice de desmatamento em áreas de mata atlântica remanescente devido à especulação imobiliária.', 
            icon: TreePine, 
            status: 'Alerta Vermelho',
            color: 'bg-green-600',
            textColor: 'text-green-800',
            bgColor: 'bg-green-100',
            metric: 'Perda Anual de Vegetação',
            metricValue: '150 ha/ano',
        },
    ],
    'Fortaleza': [
        { 
            id: 11, 
            title: 'ODS 11: Cidades Sustentáveis', 
            description: 'Baixa pontuação geral no IDSC-BR (nível "baixo"), mobilidade urbana e crise de ônibus são críticas.', 
            icon: Car, 
            status: 'Nível Baixo',
            color: 'bg-red-600',
            textColor: 'text-red-800',
            bgColor: 'bg-red-100',
            metric: 'Pontuação Geral IDSC',
            metricValue: '48.14',
        },
        { 
            id: 6, 
            title: 'ODS 6: Água e Saneamento', 
            description: 'Meta de tratamento de esgoto ainda distante do universal.', 
            icon: Layers3, 
            status: 'Requer Aceleração',
            color: 'bg-blue-600',
            textColor: 'text-blue-800',
            bgColor: 'bg-blue-100',
            metric: 'Esgoto Tratado',
            metricValue: '40%',
        },
    ],
    'Natal': [
        { 
            id: 11, 
            title: 'ODS 11: Cidades Sustentáveis', 
            description: 'Gestão de resíduos e limpeza urbana são desafios recorrentes na capital potiguar.', 
            icon: Recycle, 
            status: 'Em Replanejamento',
            color: 'bg-orange-600',
            textColor: 'text-orange-800',
            bgColor: 'bg-orange-100',
            metric: 'Resíduos Coletados',
            metricValue: '90% (Destino final: ?) ',
        },
        { 
            id: 15, 
            title: 'ODS 15: Vida Terrestre', 
            description: 'Erosão costeira e pressão sobre áreas de dunas e restingas urbanas.', 
            icon: TreePine, 
            status: 'Alto Risco',
            color: 'bg-green-600',
            textColor: 'text-green-800',
            bgColor: 'bg-green-100',
            metric: 'Áreas Protegidas Urbanas',
            metricValue: 'Em Degradação',
        },
    ],
    'Recife': [
        { 
            id: 1, 
            title: 'ODS 1: Erradicação da Pobreza', 
            description: 'Altos índices de pobreza e desigualdade em comunidades vulneráveis.', 
            icon: HeartHandshake, 
            status: 'Prioridade Social',
            color: 'bg-purple-600',
            textColor: 'text-purple-800',
            bgColor: 'bg-purple-100',
            metric: 'População em Extrema Pobreza',
            metricValue: '12% (Média)',
        },
        { 
            id: 11, 
            title: 'ODS 11: Cidades Sustentáveis', 
            description: 'Moradias em áreas de risco (encostas e palafitas) e falta de habitação adequada.', 
            icon: Home, 
            status: 'Vulnerabilidade Alta',
            color: 'bg-orange-600',
            textColor: 'text-orange-800',
            bgColor: 'bg-orange-100',
            metric: 'Déficit Habitacional',
            metricValue: '25.000 unidades',
        },
    ],
    'Salvador': [
        { 
            id: 5, 
            title: 'ODS 5: Igualdade de Gênero', 
            description: 'Desigualdade salarial e baixa representatividade feminina nos níveis de liderança.', 
            icon: Venus, 
            status: 'Requer Equidade',
            color: 'bg-red-600',
            textColor: 'text-red-800',
            bgColor: 'bg-red-100',
            metric: 'Representação Política Feminina',
            metricValue: '15%',
        },
        { 
            id: 16, 
            title: 'ODS 16: Paz, Justiça e Instituições Fortes', 
            description: 'Elevada taxa de homicídios, especialmente em bairros periféricos.', 
            icon: Scale, 
            status: 'Desafio Crítico',
            color: 'bg-indigo-600',
            textColor: 'text-indigo-800',
            bgColor: 'bg-indigo-100',
            metric: 'Taxa de Homicídios (por 100k)',
            metricValue: '45.0',
        },
    ],
};


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



const RadarTooltipContent = ({ active, payload, data, cities, latestYear }: any) => {
    if (active && payload && payload.length) {
        const categoryName = payload[0].payload.category;
        
        return (
            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-sm space-y-1">
                <p className="font-bold text-gray-800 border-b pb-1 mb-1">{categoryName}</p>
                {
                    payload.map((entry: any, index: number) => {
                        const cityName = entry.name;
                        const cityObj = data.cities.find((c: any) => c.name === cityName);
                        
                        const valueInHa = cityObj?.metrics[Object.keys(CATEGORY_LABELS).find(key => CATEGORY_LABELS[key] === categoryName) as CATEGORY_KEYS]?.[latestYear] || 0;

                        return (
                            <div key={cityName} className="flex justify-between items-center" style={{ color: entry.color }}>
                                <span className="font-semibold mr-2">{cityName}:</span>
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


const CustomCityDetail: React.FC<{ content: CustomCityContent }> = ({ content }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2">{content.title}</h3>
            
            <p className="text-gray-700 text-sm leading-relaxed">
                {content.text}
            </p>

            {/* Tabela de Dados */}
            <div className="pt-2">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Indicadores Chave</h4>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {content.table.header.map((head, index) => (
                                    <th 
                                        key={index}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {content.table.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                    {row.map((cell, cellIndex) => (
                                        <td 
                                            key={cellIndex}
                                            className={`px-6 py-4 whitespace-nowrap text-sm ${cellIndex === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const GeoFaunaDetail: React.FC<{ data: GeoFaunaData; cityName: string }> = ({ data, cityName }) => {
    
    // Array para mapear as métricas e definir o estilo de cada linha
    const metrics = [
        { 
            label: 'Posição Solar', 
            value: data.posicaoSolar, 
            icon: CloudSun, 
            color: 'text-yellow-600', 
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200' 
        },
        { 
            label: 'Solos Predominantes', 
            value: data.solos, 
            icon: Layers3, 
            color: 'text-amber-600', 
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200'
        },
        { 
            label: 'Direção dos Ventos', 
            value: data.direcaoVentos, 
            icon:  Navigation, 
            color: 'text-blue-600', 
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200' 
        },
        { 
            label: 'Fauna e Flora Local', 
            value: data.faunaFlora, 
            icon: TreePine, 
            color: 'text-green-600', 
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200' 
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-4">
            <div className="flex items-center mb-4 border-b pb-2">
                <Globe2 className="w-6 h-6 mr-2 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900">Geografia e Bioma de {cityName}</h3>
            </div>
            
            <div className="space-y-3">
                {metrics.map((metric, index) => {
                    const IconComponent = metric.icon;
                    return (
                        <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${metric.bgColor} ${metric.borderColor} shadow-sm transition-all duration-300 hover:shadow-md`}
                        >
                            <div className="flex items-start space-x-3">
                                <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${metric.color}`} />
                                <div>
                                    <h4 className={`text-sm font-bold ${metric.color} mb-1`}>{metric.label}</h4>
                                    <p className="text-sm text-gray-700">{metric.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- NOVO COMPONENTE: Tabela Climática ---
const ClimateDetailTable: React.FC<{ data: ClimateData; cityName: string }> = ({ data, cityName }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-4">
            <div className="flex items-center mb-4 border-b pb-2">
                <CloudSun className="w-6 h-6 mr-2 text-blue-500" />
                <h3 className="text-xl font-bold text-gray-900">Clima em {cityName}</h3>
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-1/3">Métrica</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">ANUAL</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-red-500 uppercase tracking-wider">QUENTE</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-blue-500 uppercase tracking-wider">FRIO</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Temperatura Máxima Média */}
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Temperatura Max. Média</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-800">{data.maxMed.anual}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-600">{data.maxMed.quente}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-blue-600">{data.maxMed.frio}</td>
                        </tr>
                        {/* Temperatura Mínima Média */}
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Temperatura Min. Média</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-800">{data.minMed.anual}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-600">{data.minMed.quente}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-blue-600">{data.minMed.frio}</td>
                        </tr>
                        {/* Umidade */}
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Umidade Relativa Média</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-800">{data.umidade.anual}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-600">{data.umidade.quente}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-blue-600">{data.umidade.frio}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Cities: React.FC = () => {
    const { data, loading, error } = useMapBiomasData();
    const initialCity = data?.cities.length ? data.cities[0].name : '';
    const [selectedCity, setSelectedCity] = useState<string>(initialCity);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        if (!selectedCity && data?.cities.length) {
            const defaultCity = data.cities.find(c => c.name === 'João Pessoa')?.name || data.cities[0].name;
            setSelectedCity(defaultCity);
        }
    }, [data, selectedCity]);


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

    const currentCityName = selectedCity || filteredCities[0]?.name;

    const odsCriticasDaCidade = ODS_CRITICAS_POR_CIDADE[currentCityName] || [];
    const customContent = DADOS_CUSTOMIZADOS_CIDADE[currentCityName];
    const climateContent = DADOS_CLIMATICOS_POR_CIDADE[currentCityName];
    const geoFaunaContent = DADOS_GEO_FAUNA_POR_CIDADE[currentCityName];



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
                    {/* 1. Lista de Cidades (Mantido) */}
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
                        {currentCityName && cityData ? (
                            <>
                                {/* Bloco de Métricas Detalhadas (Mantido) */}
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

                                    {/* Métricas por Categoria (Mini Cards - Mantido) */}
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
                                                        <span className={`font-medium mr-1 flex items-center ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
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

                                {/* Gráfico de Tendências Line Chart (Mantido) */}
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
                                
                                {/* BLOCO ODS CRÍTICAS (CORRIGIDO VISUALMENTE) */}
                                <div className="bg-white rounded-xl shadow-lg border p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                        ODS Críticas em <span className="text-red-600">{cityData.city.name}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {odsCriticasDaCidade.map((ods) => {
                                            const IconComponent = ods.icon;
                                            return (
                                                <div key={ods.id} className={`${ods.bgColor} p-4 rounded-xl border border-gray-200 flex flex-col space-y-3`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`p-2 rounded-full ${ods.color} bg-opacity-10 ${ods.textColor}`}>
                                                                <IconComponent className="w-5 h-5" />
                                                            </div>
                                                            <h4 className={`text-sm font-bold ${ods.textColor}`}>{ods.title}</h4>
                                                        </div>
                                                        {/* SELO ODS CENTRALIZADO E REDONDO: A CORREÇÃO É AQUI */}
                                                        <span 
                                                            className={`w-10 h-10 text-white font-bold rounded-full 
                                                                        flex flex-col items-center justify-center 
                                                                        ${ods.color}`} // <-- Aplica a cor de fundo sólida (e.g., bg-red-600)
                                                        >
                                                            <span className="text-[10px] leading-none">ODS</span>
                                                            <span className="text-sm leading-none">{ods.id}</span>
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-xs text-gray-700">{ods.description}</p>
                                                    
                                                    <div className="pt-2 border-t border-gray-300 border-opacity-50">
                                                        <p className="text-xs text-gray-500 font-medium">{ods.metric}</p>
                                                        <p className="text-lg font-bold text-gray-900">{ods.metricValue}</p>
                                                        <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ods.bgColor} border ${ods.textColor} border-opacity-50`}>
                                                            Status: {ods.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {odsCriticasDaCidade.length === 0 && (
                                         <div className="text-center p-4 text-gray-500 border border-dashed rounded-lg mt-4">
                                             Nenhuma ODS crítica definida para esta cidade nos dados simulados.
                                         </div>
                                    )}
                                </div>

                                {/* BLOCO DA TABELA CLIMÁTICA */}
                                {climateContent && (
                                    <ClimateDetailTable data={climateContent} cityName={currentCityName} />
                                )}
                                
                                {/* BLOCO DETALHES CUSTOMIZADOS (Texto + Tabela) */}
                                {customContent ? (
                                    <CustomCityDetail content={customContent} />
                                ) : (
                                     <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
                                         Detalhes customizados não disponíveis para {currentCityName}.
                                     </div>
                                 )}

                                 {geoFaunaContent ? (
                                        <GeoFaunaDetail data={geoFaunaContent} cityName={currentCityName} />
                                    ) : (
                                        <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
                                            Detalhes geográficos não disponíveis para {currentCityName}.
                                        </div>
                                    )}

                            </>
                        ) : (
                            /* Bloco de Seleção Inicial (Mantido) */
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

                {/* 3. Comparação Regional (Radar Chart - Mantido) */}
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