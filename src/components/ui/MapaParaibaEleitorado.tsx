'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJsonObject, Feature, Polygon, MultiPolygon } from 'geojson';
import * as turf from '@turf/turf';
import { LeafletMouseEvent } from 'leaflet';

// --- Interfaces ---
interface EleitoradoAgregado {
  'Município': string;
  'Zona Eleitoral': string;
  'Seção Eleitoral': string;
  'Local de Votação': string;
  'Gênero': string;
  'Estado Civil': string;
  'Faixa Etária': string;
  'Escolaridade': string;
  'Raça/Cor': string;
  'Identidade de Gênero': string;
  'Quilombola': string;
  'Intérprete de Libras': string;
  'Qtd. Eleitores': number;
  'Qtd. com Biometria': number;
  'Qtd. com Deficiência': number;
  'Qtd. com Nome Social': number;
}

interface MapMunicipioMetrics {
  totalEleitores: number;
  percMulheres: number;
  percJovens: number;
  percAdultos: number;
  percIdosos: number;
  percNaoInformadoFaixaEtaria: number;
  percMasculino: number;
  percFeminino: number;
  percSolteiro?: number;
  percCasado?: number;
  percDivorciado?: number;
  percViuvo?: number;
  percSeparadoJudicialmente?: number;
  percNaoInformadoEstadoCivil?: number;
  percAnalfabetos?: number;
  percFundamentalIncompleto?: number;
  percFundamentalCompleto?: number;
  percMedioIncompleto?: number;
  percMedioCompleto?: number;
  percSuperiorIncompleto?: number;
  percSuperiorCompleto?: number;
  percEscolaridadeNaoInformada?: number;
  percLeEscreve?: number;
  percBranca?: number;
  percPreta?: number;
  percParda?: number;
  percAmarela?: number;
  percIndigena?: number;
  percRacaCorNaoInformada?: number;
  percTransgenero?: number;
  percCisgenero?: number;
  percIdentidadeNaoInformada?: number;
  perc16Anos?: number;
  perc17Anos?: number;
  perc18Anos?: number;
  perc19Anos?: number;
  perc20Anos?: number;
  perc21a24Anos?: number;
  perc25a29Anos?: number;
  perc30a34Anos?: number;
  perc35a39Anos?: number;
  perc40a44Anos?: number;
  perc45a49Anos?: number;
  perc50a54Anos?: number;
  perc55a59Anos?: number;
  perc60a64Anos?: number;
  perc65a69Anos?: number;
  perc70a74Anos?: number;
  perc75a79Anos?: number;
  perc80a84Anos?: number;
  perc85a89Anos?: number;
  perc90a94Anos?: number;
  perc95a99Anos?: number;
  percSuperiorA100Anos?: number;
  // Adicione os totais brutos correspondentes aqui
  totalMulheres: number;
  totalJovens: number;
  totalAdultos: number;
  totalIdosos: number;
  totalMasculino: number;
  totalFeminino: number;
  totalSolteiro: number;
  totalCasado: number;
  totalDivorciado: number;
  totalViuvo: number;
  totalSeparadoJudicialmente: number;
  totalNaoInformadoEstadoCivil: number;
  totalAnalfabetos: number;
  totalFundamentalIncompleto: number;
  totalFundamentalCompleto: number;
  totalMedioIncompleto: number;
  totalMedioCompleto: number;
  totalSuperiorIncompleto: number;
  totalSuperiorCompleto: number;
  totalEscolaridadeNaoInformada: number;
  totalLeEscreve: number;
  totalBranca: number;
  totalPreta: number;
  totalParda: number;
  totalAmarela: number;
  totalIndigena: number;
  totalRacaCorNaoInformada: number;
  totalTransgenero: number;
  totalCisgenero: number;
  totalIdentidadeNaoInformada: number;
  total16Anos: number;
  total17Anos: number;
  total18Anos: number;
  total19Anos: number;
  total20Anos: number;
  total21a24Anos: number;
  total25a29Anos: number;
  total30a34Anos: number;
  total35a39Anos: number;
  total40a44Anos: number;
  total45a49Anos: number;
  total50a54Anos: number;
  total55a59Anos: number;
  total60a64Anos: number;
  total65a69Anos: number;
  total70a74Anos: number;
  total75a79Anos: number;
  total80a84Anos: number;
  total85a89Anos: number;
  total90a94Anos: number;
  total95a99Anos: number;
  totalSuperiorA100Anos: number;
}

interface MapaParaibaEleitoradoProps {
  apiData: EleitoradoAgregado[];
  abaAtiva: string;
  isDataLoading: boolean;
}

type LeafletMapModule = typeof import('react-leaflet');

const MapContainer = dynamic<React.ComponentProps<typeof import('react-leaflet').MapContainer>>(
  () => import('react-leaflet').then((mod: LeafletMapModule) => mod.MapContainer),
  { ssr: false }
);
const GeoJSON = dynamic<React.ComponentProps<typeof import('react-leaflet').GeoJSON>>(
  () => import('react-leaflet').then((mod: LeafletMapModule) => mod.GeoJSON),
  { ssr: false }
);

// --- Constantes e Funções Utilitárias ---
const loadGeoJson = async (): Promise<GeoJsonObject> => {
  const res = await fetch('/geojson/paraiba.geojson');
  return res.json();
};

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const FAIXAS_JOVENS = ['16 ANOS', '17 ANOS', '18 ANOS', '19 ANOS', '20 ANOS', '21 A 24 ANOS'];
const FAIXAS_ADULTOS = ['25 A 29 ANOS', '30 A 34 ANOS', '35 A 39 ANOS', '40 A 44 ANOS', '45 A 49 ANOS', '50 A 54 ANOS', '55 A 59 ANOS'];
const FAIXAS_IDOSOS = ['60 A 64 ANOS', '65 A 69 ANOS', '70 A 74 ANOS', '75 A 79 ANOS', '80 A 84 ANOS', '85 A 89 ANOS', '90 A 94 ANOS', '95 A 99 ANOS', 'SUPERIOR A 100 ANOS'];
const FAIXA_ETARIA_NAO_INFORMADO_LABEL = 'NAO INFORMADO';
const ESCOLARIDADE_NAO_INFORMADA_LABEL = 'NAO INFORMADO';
const ESTADO_CIVIL_NAO_INFORMADO_LABEL = 'NAO INFORMADO';

const ALL_FAIXAS_ETARIAS_DETALHADAS_KEYS = [
  '16Anos', '17Anos', '18Anos', '19Anos', '20Anos', '21a24Anos',
  '25a29Anos', '30a34Anos', '35a39Anos', '40a44Anos', '45a49Anos',
  '50a54Anos', '55a59Anos', '60a64Anos', '65a69Anos', '70a74Anos',
  '75a79Anos', '80a84Anos', '85a89Anos', '90a94Anos', '95a99Anos',
  'SuperiorA100Anos', 'NaoInformadoFaixaEtaria'
];

const ALL_FAIXAS_ETARIAS_LABELS_MAP: Record<string, string> = {
  'perc16Anos': '16 Anos', 'perc17Anos': '17 Anos', 'perc18Anos': '18 Anos', 'perc19Anos': '19 Anos', 'perc20Anos': '20 Anos', 'perc21a24Anos': '21 a 24 Anos',
  'perc25a29Anos': '25 a 29 Anos', 'perc30a34Anos': '30 a 34 Anos', 'perc35a39Anos': '35 a 39 Anos', 'perc40a44Anos': '40 a 44 Anos', 'perc45a49Anos': '45 a 49 Anos',
  'perc50a54Anos': '50 a 54 Anos', 'perc55a59Anos': '55 a 59 Anos', 'perc60a64Anos': '60 a 64 Anos', 'perc65a69Anos': '65 a 69 Anos', 'perc70a74Anos': '70 a 74 Anos',
  'perc75a79Anos': '75 a 79 Anos', 'perc80a84Anos': '80 a 84 Anos', 'perc85a89Anos': '85 a 89 Anos', 'perc90a94Anos': '90 a 94 Anos', 'perc95a99Anos': '95 a 99 Anos',
  'percSuperiorA100Anos': 'Superior a 100 Anos',
  'percNaoInformadoFaixaEtaria': 'Não Informado'
};

// Define os thresholds de cor para CADA métrica
const THRESHOLDS: Record<string, number[]> = {
  'totalEleitores': [500000, 250000, 100000, 50000, 20000, 10000, 5000, 2000, 0],
  'percMulheres': [65, 60, 55, 50, 45, 40, 35],
  'percFeminino': [65, 60, 55, 50, 45, 40, 35],
  'percMasculino': [65, 60, 55, 50, 45, 40, 35],
  'percJovens': [25, 20, 15, 10, 5, 0],
  'percAdultos': [70, 65, 60, 55, 50, 45],
  'percIdosos': [30, 25, 20, 15, 10, 5],
  'percSolteiro': [60, 50, 40, 30, 20, 0],
  'percCasado': [60, 50, 40, 30, 20, 0],
  'percDivorciado': [10, 5, 0],
  'percViuvo': [10, 5, 0],
  'percSeparadoJudicialmente': [5, 0],
  'percNaoInformadoEstadoCivil': [10, 0],
  'percAnalfabetos': [5, 2, 0],
  'percLeEscreve': [10, 5, 0],
  'percFundamentalIncompleto': [30, 20, 10, 0],
  'percFundamentalCompleto': [30, 20, 10, 0],
  'percMedioIncompleto': [15, 10, 5, 0],
  'percMedioCompleto': [25, 15, 10, 0],
  'percSuperiorIncompleto': [10, 5, 0],
  'percSuperiorCompleto': [15, 10, 5, 0],
  'percEscolaridadeNaoInformada': [10, 0],
  'percBranca': [60, 50, 40, 0],
  'percPreta': [10, 5, 0],
  'percParda': [40, 30, 20, 0],
  'percAmarela': [1, 0],
  'percIndigena': [0.5, 0],
  'percRacaCorNaoInformada': [5, 0],
  'percTransgenero': [0.5, 0],
  'percCisgenero': [90, 0],
  'percIdentidadeNaoInformada': [5, 0],
  ...Object.fromEntries(
    ALL_FAIXAS_ETARIAS_DETALHADAS_KEYS.map(key => [`perc${key}`, [
      key.includes('16Anos') || key.includes('17Anos') ? [1.5, 1.0, 0.5, 0] :
      key.includes('18Anos') || key.includes('19Anos') || key.includes('20Anos') ? [2.5, 2.0, 1.5, 1.0, 0.5, 0] :
      key.includes('21a24Anos') ? [10, 8, 6, 4, 2, 0] :
      key.includes('25a29Anos') || key.includes('30a34Anos') || key.includes('35a39Anos') ? [15, 12, 10, 8, 5, 0] :
      key.includes('40a44Anos') || key.includes('45a49Anos') || key.includes('50a54Anos') || key.includes('55a59Anos') ? [12, 10, 8, 6, 4, 0] :
      key.includes('60a64Anos') || key.includes('65a69Anos') ? [10, 8, 6, 4, 2, 0] :
      key.includes('70a74Anos') || key.includes('75a79Anos') || key.includes('80a84Anos') ? [6, 4, 3, 2, 1, 0] :
      key.includes('85a89Anos') || key.includes('90a94Anos') ? [3, 2, 1, 0.5, 0] :
      key.includes('95a99Anos') || key.includes('SuperiorA100Anos') ? [0.5, 0.1, 0] :
      [10, 5, 0]
    ].flat()])
  ),
};

const COLOR_PALETTES: Record<string, string[]> = {
  'totalEleitores': ['#FFF3C4', '#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'].reverse(),
  'percMulheres': ['#FFEBEE', '#F8BBD0', '#F06292', '#E91E63', '#D81B60', '#AD1457', '#880E4F'].reverse(),
  'percFeminino': ['#FFEBEE', '#F8BBD0', '#F06292', '#E91E63', '#D81B60', '#AD1457', '#880E4F'].reverse(),
  'percMasculino': ['#CFDCEB', '#9AC1DD', '#6BA3CC', '#3F89BD', '#2D6AA1', '#1C4B95', '#0A2D69'].reverse(),
  'percJovens': ['#D7E3F1', '#A9CCE3', '#7FBBD7', '#56A8CC', '#2F93BD', '#0A7CAC'].reverse(),
  'percAdultos': ['#C2E0C7', '#9CCBA0', '#76B77A', '#50A354', '#2B8F2E', '#067B08'].reverse(),
  'percIdosos': ['#FCD8B0', '#F9C48B', '#F6B066', '#F39C40', '#F0881B', '#ED7400'].reverse(),
  'percSolteiro': ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#283593', '#1A237E'].reverse(),
  'percCasado': ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1976D2', '#1565C0', '#0D47A1'].reverse(),
  'percDivorciado': ['#F8BBD0', '#F48FB1', '#EF5350', '#E53935', '#D32F2F', '#C62828', '#B71C1C'].reverse(),
  'percViuvo': ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'].reverse(),
  'percSeparadoJudicialmente': ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#283593'].reverse(),
  'percNaoInformadoEstadoCivil': ['#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037'].reverse(),
  'percAnalfabetos': ['#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037'].reverse(),
  'percLeEscreve': ['#F0F4C3', '#E6EE9C', '#DCE775', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717'].reverse(),
  'percFundamentalIncompleto': ['#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'].reverse(),
  'percFundamentalCompleto': ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'].reverse(),
  'percMedioIncompleto': ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'].reverse(),
  'percMedioCompleto': ['#F8BBD0', '#F48FB1', '#EF5350', '#E91E63', '#D81B60', '#AD1457', '#880E4F'].reverse(),
  'percSuperiorIncompleto': ['#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C'].reverse(),
  'percSuperiorCompleto': ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#388E3C', '#2E7D32', '#1B5E20'].reverse(),
  'percEscolaridadeNaoInformada': ['#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242'].reverse(),
  'percBranca': ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'].reverse(),
  'percPreta': ['#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121', '#000000'].reverse(),
  'percParda': ['#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037'].reverse(),
  'percAmarela': ['#FFECB3', '#FFE082', '#FFD740', '#FFC107', '#FFB300', '#FFA000', '#FF8F00'].reverse(),
  'percIndigena': ['#E8F5E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#558B2F'].reverse(),
  'percRacaCorNaoInformada': ['#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64'].reverse(),
  'percTransgenero': ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2'].reverse(),
  'percCisgenero': ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#388E3C'].reverse(),
  'percIdentidadeNaoInformada': ['#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64'].reverse(),
  ...Object.fromEntries(
    ALL_FAIXAS_ETARIAS_DETALHADAS_KEYS.map(key => [`perc${key}`, ['#F0F4C3', '#E6EE9C', '#DCE775', '#CDDC39', '#C0CA33', '#AFB42B', '#9E9D24', '#827717'].reverse()])
  )
};

const COR_DESTAQUE_SELECAO = '#32CD32';
const COR_BORDA_MUNICIPIO = '#4a4a4a';
const PESO_BORDA = 0.8;

// --- Componente MapaParaibaEleitorado ---
const MapaParaibaEleitorado = ({ apiData, abaAtiva, isDataLoading }: MapaParaibaEleitoradoProps) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [municipioClicadoInternamente, setMunicipioClicadoInternamente] = useState<string | null>(null);
  const [detalhesMunicipioClicado, setDetalhesMunicipioClicado] = useState<{
    nome: string;
    metrics: MapMunicipioMetrics;
  } | null>(null);

  const cacheMetricsMunicipio = useRef<Record<string, MapMunicipioMetrics>>({});
  type DisplayMetric = keyof MapMunicipioMetrics;

  const [metricToDisplay, setMetricToDisplay] = useState<DisplayMetric>('totalEleitores');

  const geoJsonLayerRef = useRef<any>(null);

  const metricOptions: Record<string, { value: DisplayMetric; label: string }[]> = useMemo(() => {
    const baseOptions: Record<string, { value: DisplayMetric; label: string }[]> = {
      'Visão Geral': [
        { value: 'totalEleitores', label: 'Total de Eleitores' },
        { value: 'percMulheres', label: 'Percentual de Mulheres' },
        { value: 'percJovens', label: 'Percentual de Jovens (16-24)' },
        { value: 'percAdultos', label: 'Percentual de Adultos (25-59)' },
        { value: 'percIdosos', label: 'Percentual de Idosos (60+)' },
      ],
      'Gênero': [
        { value: 'percFeminino', label: 'Percentual Feminino' },
        { value: 'percMasculino', label: 'Percentual Masculino' },
      ],
      'Estado Civil': [
        { value: 'percSolteiro', label: 'Percentual Solteiro(a)' },
        { value: 'percCasado', label: 'Percentual Casado(a)' },
        { value: 'percDivorciado', label: 'Percentual Divorciado(a)' },
        { value: 'percViuvo', label: 'Percentual Viúvo(a)' },
        { value: 'percSeparadoJudicialmente', label: 'Percentual Separado(a) Judicialmente' },
      ],
      'Escolaridade': [
        { value: 'percAnalfabetos', label: 'Percentual Analfabetos' },
        { value: 'percLeEscreve', label: 'Lê e Escreve' },
        { value: 'percFundamentalIncompleto', label: 'Fundamental Incompleto' },
        { value: 'percFundamentalCompleto', label: 'Fundamental Completo' },
        { value: 'percMedioIncompleto', label: 'Médio Incompleto' },
        { value: 'percMedioCompleto', label: 'Médio Completo' },
        { value: 'percSuperiorIncompleto', label: 'Superior Incompleto' },
        { value: 'percSuperiorCompleto', label: 'Superior Completo' },
      ],
      'Raça/Cor': [
        { value: 'percBranca', label: 'Percentual Branca' },
        { value: 'percPreta', label: 'Percentual Preta' },
        { value: 'percParda', label: 'Percentual Parda' },
        { value: 'percAmarela', label: 'Percentual Amarela' },
        { value: 'percIndigena', label: 'Percentual Indígena' },
        { value: 'percRacaCorNaoInformada', label: 'Não Informada' },
      ],
      'Identidade de Gênero': [
        { value: 'percTransgenero', label: 'Percentual Transgênero' },
        { value: 'percCisgenero', label: 'Percentual Cisgênero' },
        { value: 'percIdentidadeNaoInformada', label: 'Prefiro Não Dizer / Não Informado' },
      ],
    };

    return {
      ...baseOptions,
      'Faixa Etária': [
        ...ALL_FAIXAS_ETARIAS_DETALHADAS_KEYS.map(key => ({
          value: `perc${key}` as DisplayMetric,
          label: ALL_FAIXAS_ETARIAS_LABELS_MAP[`perc${key}`]
        })).sort((a, b) => {
          if (a.label === 'Não Informado') return 1;
          if (b.label === 'Não Informado') return -1;
          
          const extractMinAge = (label: string): number => {
            if (typeof label !== 'string' || !label) {
                return Infinity;
            }
            const match = label.match(/(\d+)/);
            return match && match[1] ? parseInt(match[1]) : Infinity;
          };
          return extractMinAge(a.label) - extractMinAge(b.label);
        })
      ]
    };
  }, []);

  useEffect(() => {
    if (abaAtiva in metricOptions) {
      setMetricToDisplay(metricOptions[abaAtiva][0].value);
    } else {
      setMetricToDisplay('totalEleitores');
    }
  }, [abaAtiva, metricOptions]);


  const getColorScale = useCallback((metricName: DisplayMetric, value: number) => {
    const thresholds = THRESHOLDS[metricName];
    const palette = COLOR_PALETTES[metricName] || ['#CCCCCC'];

    if (!thresholds || thresholds.length === 0) {
      return '#CCCCCC';
    }

    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) {
        return palette[i] || palette[palette.length - 1];
      }
    }
    return palette[palette.length - 1] || '#CCCCCC';
  }, []);

  const getStyleForMap = useCallback((feature: any) => {
    const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
    const municipioNormalizado = removerAcentos(nomeMunicipio?.toUpperCase() || '');
    const metrics = cacheMetricsMunicipio.current?.[municipioNormalizado];

    let color = '#CCCCCC';

    if (metrics) {
      const displayValue = metrics[metricToDisplay] as number || 0;
      color = getColorScale(metricToDisplay, displayValue);
    }

    const isSelected = municipioNormalizado === removerAcentos(municipioClicadoInternamente?.toUpperCase() || '');

    return {
      fillColor: isSelected ? COR_DESTAQUE_SELECAO : color,
      color: COR_BORDA_MUNICIPIO,
      weight: PESO_BORDA,
      fillOpacity: isSelected ? 1 : 0.8,
    };
  }, [metricToDisplay, getColorScale, municipioClicadoInternamente]);

  useEffect(() => {
    setIsClient(true);
    loadGeoJson().then(setGeoJsonData).catch(console.error);
  }, []);

  useEffect(() => {
    setMunicipioClicadoInternamente(null);
    setDetalhesMunicipioClicado(null);

    const tempMetrics: Record<string, {
      totalEleitores: number;
      totalMulheres: number;
      totalJovens: number;
      totalAdultos: number;
      totalIdosos: number;
      totalNaoInformadoFaixaEtaria: number;
      totalMasculino: number;
      totalFeminino: number;
      totalSolteiro: number;
      totalCasado: number;
      totalDivorciado: number;
      totalViuvo: number;
      totalSeparadoJudicialmente: number;
      totalNaoInformadoEstadoCivil: number;
      totalAnalfabetos: number;
      totalFundamentalIncompleto: number;
      totalFundamentalCompleto: number;
      totalMedioIncompleto: number;
      totalMedioCompleto: number;
      totalSuperiorIncompleto: number;
      totalSuperiorCompleto: number;
      totalEscolaridadeNaoInformada: number;
      totalLeEscreve: number;
      totalBranca: number;
      totalPreta: number;
      totalParda: number;
      totalAmarela: number;
      totalIndigena: number;
      totalRacaCorNaoInformada: number;
      totalTransgenero: number;
      totalCisgenero: number;
      totalIdentidadeNaoInformada: number;
      total16Anos: number;
      total17Anos: number;
      total18Anos: number;
      total19Anos: number;
      total20Anos: number;
      total21a24Anos: number;
      total25a29Anos: number;
      total30a34Anos: number;
      total35a39Anos: number;
      total40a44Anos: number;
      total45a49Anos: number;
      total50a54Anos: number;
      total55a59Anos: number;
      total60a64Anos: number;
      total65a69Anos: number;
      total70a74Anos: number;
      total75a79Anos: number;
      total80a84Anos: number;
      total85a89Anos: number;
      total90a94Anos: number;
      total95a99Anos: number;
      totalSuperiorA100Anos: number;
    }> = {};

    apiData.forEach((dado: EleitoradoAgregado) => {
      const municipioNome = removerAcentos(dado['Município']?.toUpperCase() || '');
      const qtdEleitores = dado['Qtd. Eleitores'];
      const genero = removerAcentos(dado['Gênero']?.toUpperCase().trim() || '');
      const faixaEtaria = removerAcentos(dado['Faixa Etária']?.toUpperCase().trim() || '');
      const estadoCivil = removerAcentos(dado['Estado Civil']?.toUpperCase().trim() || '');
      const escolaridade = removerAcentos(dado['Escolaridade']?.toUpperCase().trim() || '');
      const racaCor = removerAcentos(dado['Raça/Cor']?.toUpperCase().trim() || '');
      const identidadeGenero = removerAcentos(dado['Identidade de Gênero']?.toUpperCase().trim() || '');


      if (!municipioNome || isNaN(qtdEleitores) || qtdEleitores === null || qtdEleitores === undefined) return;

      if (!tempMetrics[municipioNome]) {
        tempMetrics[municipioNome] = {
          totalEleitores: 0, totalMulheres: 0, totalJovens: 0, totalAdultos: 0,
          totalIdosos: 0, totalNaoInformadoFaixaEtaria: 0, totalMasculino: 0,
          totalFeminino: 0, totalSolteiro: 0, totalCasado: 0, totalDivorciado: 0,
          totalViuvo: 0, totalSeparadoJudicialmente: 0, totalNaoInformadoEstadoCivil: 0,
          totalAnalfabetos: 0, totalFundamentalIncompleto: 0, totalFundamentalCompleto: 0,
          totalMedioIncompleto: 0, totalMedioCompleto: 0, totalSuperiorIncompleto: 0,
          totalSuperiorCompleto: 0,
          totalEscolaridadeNaoInformada: 0,
          totalLeEscreve: 0,
          totalBranca: 0, totalPreta: 0, totalParda: 0, totalAmarela: 0, totalIndigena: 0, totalRacaCorNaoInformada: 0,
          totalTransgenero: 0, totalCisgenero: 0, totalIdentidadeNaoInformada: 0,
          total16Anos: 0, total17Anos: 0, total18Anos: 0, total19Anos: 0, total20Anos: 0, total21a24Anos: 0,
          total25a29Anos: 0, total30a34Anos: 0, total35a39Anos: 0, total40a44Anos: 0, total45a49Anos: 0,
          total50a54Anos: 0, total55a59Anos: 0, total60a64Anos: 0, total65a69Anos: 0, total70a74Anos: 0,
          total75a79Anos: 0, total80a84Anos: 0, total85a89Anos: 0, total90a94Anos: 0, total95a99Anos: 0,
          totalSuperiorA100Anos: 0,
        };
      }

      tempMetrics[municipioNome].totalEleitores += qtdEleitores;

      if (genero === 'FEMININO') {
        tempMetrics[municipioNome].totalMulheres += qtdEleitores;
        tempMetrics[municipioNome].totalFeminino += qtdEleitores;
      } else if (genero === 'MASCULINO') {
        tempMetrics[municipioNome].totalMasculino += qtdEleitores;
      }

      switch (faixaEtaria) {
        case '16 ANOS': tempMetrics[municipioNome].total16Anos += qtdEleitores; break;
        case '17 ANOS': tempMetrics[municipioNome].total17Anos += qtdEleitores; break;
        case '18 ANOS': tempMetrics[municipioNome].total18Anos += qtdEleitores; break;
        case '19 ANOS': tempMetrics[municipioNome].total19Anos += qtdEleitores; break;
        case '20 ANOS': tempMetrics[municipioNome].total20Anos += qtdEleitores; break;
        case '21 A 24 ANOS': tempMetrics[municipioNome].total21a24Anos += qtdEleitores; break;
        case '25 A 29 ANOS': tempMetrics[municipioNome].total25a29Anos += qtdEleitores; break;
        case '30 A 34 ANOS': tempMetrics[municipioNome].total30a34Anos += qtdEleitores; break;
        case '35 A 39 ANOS': tempMetrics[municipioNome].total35a39Anos += qtdEleitores; break;
        case '40 A 44 ANOS': tempMetrics[municipioNome].total40a44Anos += qtdEleitores; break;
        case '45 A 49 ANOS': tempMetrics[municipioNome].total45a49Anos += qtdEleitores; break;
        case '50 A 54 ANOS': tempMetrics[municipioNome].total50a54Anos += qtdEleitores; break;
        case '55 A 59 ANOS': tempMetrics[municipioNome].total55a59Anos += qtdEleitores; break;
        case '60 A 64 ANOS': tempMetrics[municipioNome].total60a64Anos += qtdEleitores; break;
        case '65 A 69 ANOS': tempMetrics[municipioNome].total65a69Anos += qtdEleitores; break;
        case '70 A 74 ANOS': tempMetrics[municipioNome].total70a74Anos += qtdEleitores; break;
        case '75 A 79 ANOS': tempMetrics[municipioNome].total75a79Anos += qtdEleitores; break;
        case '80 A 84 ANOS': tempMetrics[municipioNome].total80a84Anos += qtdEleitores; break;
        case '85 A 89 ANOS': tempMetrics[municipioNome].total85a89Anos += qtdEleitores; break;
        case '90 A 94 ANOS': tempMetrics[municipioNome].total90a94Anos += qtdEleitores; break;
        case '95 A 99 ANOS': tempMetrics[municipioNome].total95a99Anos += qtdEleitores; break;
        case 'SUPERIOR A 100 ANOS': tempMetrics[municipioNome].totalSuperiorA100Anos += qtdEleitores; break;
        case FAIXA_ETARIA_NAO_INFORMADO_LABEL: tempMetrics[municipioNome].totalNaoInformadoFaixaEtaria += qtdEleitores; break;
        default: break;
      }

      if (FAIXAS_JOVENS.includes(faixaEtaria)) {
        tempMetrics[municipioNome].totalJovens += qtdEleitores;
      } else if (FAIXAS_ADULTOS.includes(faixaEtaria)) {
        tempMetrics[municipioNome].totalAdultos += qtdEleitores;
      } else if (FAIXAS_IDOSOS.includes(faixaEtaria)) {
        tempMetrics[municipioNome].totalIdosos += qtdEleitores;
      }

      switch (estadoCivil) {
        case 'SOLTEIRO': tempMetrics[municipioNome].totalSolteiro += qtdEleitores; break;
        case 'CASADO': tempMetrics[municipioNome].totalCasado += qtdEleitores; break;
        case 'DIVORCIADO': tempMetrics[municipioNome].totalDivorciado += qtdEleitores; break;
        case 'VIUVO': tempMetrics[municipioNome].totalViuvo += qtdEleitores; break;
        case 'SEPARADO JUDICIALMENTE': tempMetrics[municipioNome].totalSeparadoJudicialmente += qtdEleitores; break;
        case ESTADO_CIVIL_NAO_INFORMADO_LABEL: tempMetrics[municipioNome].totalNaoInformadoEstadoCivil += qtdEleitores; break;
        default: break;
      }

      switch (escolaridade) {
        case 'ANALFABETO': tempMetrics[municipioNome].totalAnalfabetos += qtdEleitores; break;
        case 'ENSINO FUNDAMENTAL INCOMPLETO': tempMetrics[municipioNome].totalFundamentalIncompleto += qtdEleitores; break;
        case 'ENSINO FUNDAMENTAL COMPLETO': tempMetrics[municipioNome].totalFundamentalCompleto += qtdEleitores; break;
        case 'ENSINO MEDIO INCOMPLETO': tempMetrics[municipioNome].totalMedioIncompleto += qtdEleitores; break;
        case 'ENSINO MEDIO COMPLETO': tempMetrics[municipioNome].totalMedioCompleto += qtdEleitores; break;
        case 'LE E ESCREVE': tempMetrics[municipioNome].totalLeEscreve += qtdEleitores; break;
        case 'SUPERIOR INCOMPLETO': tempMetrics[municipioNome].totalSuperiorIncompleto += qtdEleitores; break;
        case 'SUPERIOR COMPLETO': tempMetrics[municipioNome].totalSuperiorCompleto += qtdEleitores; break;
        case ESCOLARIDADE_NAO_INFORMADA_LABEL: tempMetrics[municipioNome].totalEscolaridadeNaoInformada += qtdEleitores; break;
        default: break;
      }

      switch (racaCor) {
        case 'BRANCA': tempMetrics[municipioNome].totalBranca += qtdEleitores; break;
        case 'PRETA': tempMetrics[municipioNome].totalPreta += qtdEleitores; break;
        case 'PARDA': tempMetrics[municipioNome].totalParda += qtdEleitores; break;
        case 'AMARELA': tempMetrics[municipioNome].totalAmarela += qtdEleitores; break;
        case 'INDIGENA': tempMetrics[municipioNome].totalIndigena += qtdEleitores; break;
        case 'NAO INFORMADA': tempMetrics[municipioNome].totalRacaCorNaoInformada += qtdEleitores; break;
        default: break;
      }

      switch (identidadeGenero) {
        case 'TRANSGENERO': tempMetrics[municipioNome].totalTransgenero += qtdEleitores; break;
        case 'CISGENERO': tempMetrics[municipioNome].totalCisgenero += qtdEleitores; break;
        case 'PREFIRO NAO DIZER': tempMetrics[municipioNome].totalIdentidadeNaoInformada += qtdEleitores; break;
        case 'NAO INFORMADO': tempMetrics[municipioNome].totalIdentidadeNaoInformada += qtdEleitores; break;
        default: break;
      }
    });

    const finalMetrics: Record<string, MapMunicipioMetrics> = {};
    for (const muni in tempMetrics) {
      const total = tempMetrics[muni].totalEleitores;
      finalMetrics[muni] = {
        totalEleitores: total,
        percMulheres: total > 0 ? (tempMetrics[muni].totalMulheres / total) * 100 : 0,
        percJovens: total > 0 ? (tempMetrics[muni].totalJovens / total) * 100 : 0,
        percAdultos: total > 0 ? (tempMetrics[muni].totalAdultos / total) * 100 : 0,
        percIdosos: total > 0 ? (tempMetrics[muni].totalIdosos / total) * 100 : 0,
        percNaoInformadoFaixaEtaria: total > 0 ? (tempMetrics[muni].totalNaoInformadoFaixaEtaria / total) * 100 : 0,
        percMasculino: total > 0 ? (tempMetrics[muni].totalMasculino / total) * 100 : 0,
        percFeminino: total > 0 ? (tempMetrics[muni].totalFeminino / total) * 100 : 0,
        percSolteiro: total > 0 ? (tempMetrics[muni].totalSolteiro / total) * 100 : 0,
        percCasado: total > 0 ? (tempMetrics[muni].totalCasado / total) * 100 : 0,
        percDivorciado: total > 0 ? (tempMetrics[muni].totalDivorciado / total) * 100 : 0,
        percViuvo: total > 0 ? (tempMetrics[muni].totalViuvo / total) * 100 : 0,
        percSeparadoJudicialmente: total > 0 ? (tempMetrics[muni].totalSeparadoJudicialmente / total) * 100 : 0,
        percNaoInformadoEstadoCivil: total > 0 ? (tempMetrics[muni].totalNaoInformadoEstadoCivil / total) * 100 : 0,
        percAnalfabetos: total > 0 ? (tempMetrics[muni].totalAnalfabetos / total) * 100 : 0,
        percFundamentalIncompleto: total > 0 ? (tempMetrics[muni].totalFundamentalIncompleto / total) * 100 : 0,
        percFundamentalCompleto: total > 0 ? (tempMetrics[muni].totalFundamentalCompleto / total) * 100 : 0,
        percMedioIncompleto: total > 0 ? (tempMetrics[muni].totalMedioIncompleto / total) * 100 : 0,
        percMedioCompleto: total > 0 ? (tempMetrics[muni].totalMedioCompleto / total) * 100 : 0,
        percLeEscreve: total > 0 ? (tempMetrics[muni].totalLeEscreve / total) * 100 : 0,
        percSuperiorIncompleto: total > 0 ? (tempMetrics[muni].totalSuperiorIncompleto / total) * 100 : 0,
        percSuperiorCompleto: total > 0 ? (tempMetrics[muni].totalSuperiorCompleto / total) * 100 : 0,
        percEscolaridadeNaoInformada: total > 0 ? (tempMetrics[muni].totalEscolaridadeNaoInformada / total) * 100 : 0,
        percBranca: total > 0 ? (tempMetrics[muni].totalBranca / total) * 100 : 0,
        percPreta: total > 0 ? (tempMetrics[muni].totalPreta / total) * 100 : 0,
        percParda: total > 0 ? (tempMetrics[muni].totalParda / total) * 100 : 0,
        percAmarela: total > 0 ? (tempMetrics[muni].totalAmarela / total) * 100 : 0,
        percIndigena: total > 0 ? (tempMetrics[muni].totalIndigena / total) * 100 : 0,
        percRacaCorNaoInformada: total > 0 ? (tempMetrics[muni].totalRacaCorNaoInformada / total) * 100 : 0,
        percTransgenero: total > 0 ? (tempMetrics[muni].totalTransgenero / total) * 100 : 0,
        percCisgenero: total > 0 ? (tempMetrics[muni].totalCisgenero / total) * 100 : 0,
        percIdentidadeNaoInformada: total > 0 ? (tempMetrics[muni].totalIdentidadeNaoInformada / total) * 100 : 0,
        perc16Anos: total > 0 ? (tempMetrics[muni].total16Anos / total) * 100 : 0,
        perc17Anos: total > 0 ? (tempMetrics[muni].total17Anos / total) * 100 : 0,
        perc18Anos: total > 0 ? (tempMetrics[muni].total18Anos / total) * 100 : 0,
        perc19Anos: total > 0 ? (tempMetrics[muni].total19Anos / total) * 100 : 0,
        perc20Anos: total > 0 ? (tempMetrics[muni].total20Anos / total) * 100 : 0,
        perc21a24Anos: total > 0 ? (tempMetrics[muni].total21a24Anos / total) * 100 : 0,
        perc25a29Anos: total > 0 ? (tempMetrics[muni].total25a29Anos / total) * 100 : 0,
        perc30a34Anos: total > 0 ? (tempMetrics[muni].total30a34Anos / total) * 100 : 0,
        perc35a39Anos: total > 0 ? (tempMetrics[muni].total35a39Anos / total) * 100 : 0,
        perc40a44Anos: total > 0 ? (tempMetrics[muni].total40a44Anos / total) * 100 : 0,
        perc45a49Anos: total > 0 ? (tempMetrics[muni].total45a49Anos / total) * 100 : 0,
        perc50a54Anos: total > 0 ? (tempMetrics[muni].total50a54Anos / total) * 100 : 0,
        perc55a59Anos: total > 0 ? (tempMetrics[muni].total55a59Anos / total) * 100 : 0,
        perc60a64Anos: total > 0 ? (tempMetrics[muni].total60a64Anos / total) * 100 : 0,
        perc65a69Anos: total > 0 ? (tempMetrics[muni].total65a69Anos / total) * 100 : 0,
        perc70a74Anos: total > 0 ? (tempMetrics[muni].total70a74Anos / total) * 100 : 0,
        perc75a79Anos: total > 0 ? (tempMetrics[muni].total75a79Anos / total) * 100 : 0,
        perc80a84Anos: total > 0 ? (tempMetrics[muni].total80a84Anos / total) * 100 : 0,
        perc85a89Anos: total > 0 ? (tempMetrics[muni].total85a89Anos / total) * 100 : 0,
        perc90a94Anos: total > 0 ? (tempMetrics[muni].total90a94Anos / total) * 100 : 0,
        perc95a99Anos: total > 0 ? (tempMetrics[muni].total95a99Anos / total) * 100 : 0,
        percSuperiorA100Anos: total > 0 ? (tempMetrics[muni].totalSuperiorA100Anos / total) * 100 : 0,
        // E aqui você já está populando os campos `total...` brutos que você mapeou na interface `MapMunicipioMetrics`
        totalMulheres: tempMetrics[muni].totalMulheres,
        totalJovens: tempMetrics[muni].totalJovens,
        totalAdultos: tempMetrics[muni].totalAdultos,
        totalIdosos: tempMetrics[muni].totalIdosos,
        totalMasculino: tempMetrics[muni].totalMasculino,
        totalFeminino: tempMetrics[muni].totalFeminino,
        totalSolteiro: tempMetrics[muni].totalSolteiro,
        totalCasado: tempMetrics[muni].totalCasado,
        totalDivorciado: tempMetrics[muni].totalDivorciado,
        totalViuvo: tempMetrics[muni].totalViuvo,
        totalSeparadoJudicialmente: tempMetrics[muni].totalSeparadoJudicialmente,
        totalNaoInformadoEstadoCivil: tempMetrics[muni].totalNaoInformadoEstadoCivil,
        totalAnalfabetos: tempMetrics[muni].totalAnalfabetos,
        totalFundamentalIncompleto: tempMetrics[muni].totalFundamentalIncompleto,
        totalFundamentalCompleto: tempMetrics[muni].totalFundamentalCompleto,
        totalMedioIncompleto: tempMetrics[muni].totalMedioIncompleto,
        totalMedioCompleto: tempMetrics[muni].totalMedioCompleto,
        totalSuperiorIncompleto: tempMetrics[muni].totalSuperiorIncompleto,
        totalSuperiorCompleto: tempMetrics[muni].totalSuperiorCompleto,
        totalEscolaridadeNaoInformada: tempMetrics[muni].totalEscolaridadeNaoInformada,
        totalLeEscreve: tempMetrics[muni].totalLeEscreve,
        totalBranca: tempMetrics[muni].totalBranca,
        totalPreta: tempMetrics[muni].totalPreta,
        totalParda: tempMetrics[muni].totalParda,
        totalAmarela: tempMetrics[muni].totalAmarela,
        totalIndigena: tempMetrics[muni].totalIndigena,
        totalRacaCorNaoInformada: tempMetrics[muni].totalRacaCorNaoInformada,
        totalTransgenero: tempMetrics[muni].totalTransgenero,
        totalCisgenero: tempMetrics[muni].totalCisgenero,
        totalIdentidadeNaoInformada: tempMetrics[muni].totalIdentidadeNaoInformada,
        total16Anos: tempMetrics[muni].total16Anos,
        total17Anos: tempMetrics[muni].total17Anos,
        total18Anos: tempMetrics[muni].total18Anos,
        total19Anos: tempMetrics[muni].total19Anos,
        total20Anos: tempMetrics[muni].total20Anos,
        total21a24Anos: tempMetrics[muni].total21a24Anos,
        total25a29Anos: tempMetrics[muni].total25a29Anos,
        total30a34Anos: tempMetrics[muni].total30a34Anos,
        total35a39Anos: tempMetrics[muni].total35a39Anos,
        total40a44Anos: tempMetrics[muni].total40a44Anos,
        total45a49Anos: tempMetrics[muni].total45a49Anos,
        total50a54Anos: tempMetrics[muni].total50a54Anos,
        total55a59Anos: tempMetrics[muni].total55a59Anos,
        total60a64Anos: tempMetrics[muni].total60a64Anos,
        total65a69Anos: tempMetrics[muni].total65a69Anos,
        total70a74Anos: tempMetrics[muni].total70a74Anos,
        total75a79Anos: tempMetrics[muni].total75a79Anos,
        total80a84Anos: tempMetrics[muni].total80a84Anos,
        total85a89Anos: tempMetrics[muni].total85a89Anos,
        total90a94Anos: tempMetrics[muni].total90a94Anos,
        total95a99Anos: tempMetrics[muni].total95a99Anos,
        totalSuperiorA100Anos: tempMetrics[muni].totalSuperiorA100Anos,
      };
    }
    cacheMetricsMunicipio.current = finalMetrics;
  }, [apiData]);

  const ClickHandler = () => {
    useMapEvents({
      click: (e: LeafletMouseEvent) => {
        if (!geoJsonData || !('features' in geoJsonData)) return;
        const clickedPoint = turf.point([e.latlng.lng, e.latlng.lat]);
        let foundMunicipio: Feature | undefined;

        for (const feature of geoJsonData.features as Feature[]) {
          if (feature.geometry) {
            if (feature.geometry.type === 'Polygon') {
              const polygon = turf.polygon(feature.geometry.coordinates as Polygon['coordinates']);
              if (turf.booleanPointInPolygon(clickedPoint, polygon)) { foundMunicipio = feature; break; }
            } else if (feature.geometry.type === 'MultiPolygon') {
              for (const singlePolygonCoords of feature.geometry.coordinates as MultiPolygon['coordinates']) {
                const polygon = turf.polygon(singlePolygonCoords);
                if (turf.booleanPointInPolygon(clickedPoint, polygon)) { foundMunicipio = feature; break; }
              }
            }
          }
          if (foundMunicipio) break;
        }

        if (foundMunicipio) {
          const nome = foundMunicipio.properties?.NOME || foundMunicipio.properties?.name;
          const municipioNormalizado = removerAcentos(nome?.toUpperCase() || '');
          const metrics = cacheMetricsMunicipio.current?.[municipioNormalizado];

          if (metrics) {
            setMunicipioClicadoInternamente(nome);
            setDetalhesMunicipioClicado({ nome: nome, metrics: metrics });
          } else {
            setMunicipioClicadoInternamente(null);
            setDetalhesMunicipioClicado(null);
          }
        } else {
          setMunicipioClicadoInternamente(null);
          setDetalhesMunicipioClicado(null);
        }
      },
    });
    return null;
  };

  useEffect(() => {
    if (!geoJsonData || !('features' in geoJsonData) || !isClient || !geoJsonLayerRef.current) return;
    const layers = geoJsonLayerRef.current.getLayers();
    layers.forEach((layer: any) => {
      const feature = layer.feature;
      if (!feature) return;
      const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
      const municipioNormalizado = removerAcentos(nomeMunicipio?.toUpperCase() || '');
      const isSelected = municipioNormalizado === removerAcentos(municipioClicadoInternamente?.toUpperCase() || '');
      const currentStyle = getStyleForMap(feature);
      layer.setStyle(currentStyle);
      if (isSelected) {
        if (typeof window !== 'undefined' && (window as any).L && (window as any).L.Browser.ie && (window as any).L.Browser.chrome) {
          layer.bringToFront();
        }
      }
    });
  }, [municipioClicadoInternamente, geoJsonData, isClient, getStyleForMap, abaAtiva, metricToDisplay, isDataLoading]);


  return (
    <div className="relative flex flex-col md:flex-row gap-4 items-start bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Distribuição do Eleitorado na Paraíba
        </h3>
        {(abaAtiva in metricOptions) && (
          <div className="flex flex-wrap gap-2 mb-4 items-center relative">
            <label htmlFor="metric-select" className="block text-sm font-medium text-gray-700 mr-2">Visualizar por:</label>
            <div className="relative w-fit">
              <select
                id="metric-select"
                className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2 px-4 pr-8 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={metricToDisplay}
                onChange={(e) => {
                  setMetricToDisplay(e.target.value as DisplayMetric);
                  setMunicipioClicadoInternamente(null);
                  setDetalhesMunicipioClicado(null);
                }}
                disabled={isDataLoading}
              >
                {metricOptions[abaAtiva].map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
              </div>
            </div>
          </div>
        )}

        {isClient && geoJsonData && !isDataLoading ? (
          <MapContainer
            center={[-7.13, -36.8245]}
            zoom={8}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            style={{ height: '70vh', width: '100%', backgroundColor: 'white' }}
          >
            <GeoJSON
              data={geoJsonData}
              style={getStyleForMap}
              ref={geoJsonLayerRef}
              onEachFeature={(feature, layer) => {
                const nomeMunicipio = feature.properties?.NOME || feature.properties?.name;
                const municipioNormalizado = removerAcentos(nomeMunicipio?.toUpperCase() || '');
                const metrics = cacheMetricsMunicipio.current?.[municipioNormalizado];
                let tooltipContent = `<b>${nomeMunicipio}</b><br/>`;

                if (metrics) {
                  const selectedMetricOption = metricOptions[abaAtiva]?.find(opt => opt.value === metricToDisplay);
                  const selectedMetricLabel = selectedMetricOption?.label;
                  const displayValue = metrics[metricToDisplay as keyof MapMunicipioMetrics];

                  if (selectedMetricLabel && typeof displayValue === 'number' && !isNaN(displayValue)) {
                    if (metricToDisplay.startsWith('perc')) {
                      // EXIBIÇÃO DA PORCENTAGEM E DO NÚMERO BRUTO AQUI!
                      const totalValueKey = metricToDisplay.replace('perc', 'total') as keyof MapMunicipioMetrics; // Converte 'percX' para 'totalX'
                      const totalValue = (metrics[totalValueKey] as number) || 0;

                      tooltipContent += `${selectedMetricLabel}: ${displayValue.toFixed(2)}% (${totalValue.toLocaleString('pt-BR')} eleitores)`;
                    } else {
                      tooltipContent += `${selectedMetricLabel}: ${displayValue.toLocaleString('pt-BR')}`;
                    }
                  } else {
                    tooltipContent += `${selectedMetricLabel || 'Métrica selecionada'}: Dados indisponíveis`;
                  }
                } else {
                  tooltipContent += `Dados indisponíveis`;
                }
                layer.bindTooltip(tooltipContent, { permanent: false, direction: 'auto' });
                layer.on({ mouseover: (e: LeafletMouseEvent) => { if (typeof window !== 'undefined' && (window as any).L && (window as any).L.Browser.ie && (window as any).L.Browser.chrome) { e.target.bringToFront(); } }, mouseout: (e: LeafletMouseEvent) => { } });
              }}
            />
            <ClickHandler />
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-[70vh] bg-gray-100 rounded-md text-gray-500">
            Carregando mapa...
          </div>
        )}
      </div>

      <div className="w-full md:w-80 p-4 border rounded bg-white shadow-sm mx-auto">
        <h2 className="text-center text-base font-semibold mb-4 text-gray-800">Legenda ({
          (abaAtiva in metricOptions && metricOptions[abaAtiva].find(opt => opt.value === metricToDisplay)?.label) || 'Métrica Atual'
        })</h2>
        <div className="flex flex-col gap-2">
          {(() => {
            const thresholds = THRESHOLDS[metricToDisplay];
            const palette = COLOR_PALETTES[metricToDisplay];

            if (!thresholds || thresholds.length === 0 || !palette || palette.length === 0) {
              return <div className="text-sm text-gray-800">Legenda não disponível para esta métrica.</div>;
            }

            const sortedThresholds = [...thresholds].sort((a, b) => b - a);

            return (
              <>
                {sortedThresholds.map((th, index) => {
                  let label = '';
                  const isPercentage = metricToDisplay.startsWith('perc');
                  const unit = isPercentage ? '%' : '';

                  const nextThIndex = index + 1;
                  const nextTh = sortedThresholds[nextThIndex];

                  if (index === 0) {
                    label = `> ${th.toLocaleString('pt-BR')}${unit}`;
                  } else if (nextTh !== undefined) {
                    label = `${nextTh.toLocaleString('pt-BR')}${unit} - ${th.toLocaleString('pt-BR')}${unit}`;
                  } else {
                    if (th === 0 && sortedThresholds.length > 1) {
                        label = `< ${sortedThresholds[sortedThresholds.length - 2].toLocaleString('pt-BR')}${unit}`;
                    } else if (th === 0 && sortedThresholds.length === 1) {
                        label = `0${unit}`;
                    } else {
                        label = `< ${th.toLocaleString('pt-BR')}${unit}`;
                    }
                  }

                  const originalThresholdIndex = thresholds.indexOf(th);
                  const color = palette[originalThresholdIndex] || palette[palette.length - 1];

                  return (
                    <div key={`${metricToDisplay}-${label}-${index}`} className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: color }}></div>
                      <span className="text-sm text-gray-800">{label}</span>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>

      {detalhesMunicipioClicado && (
        <div className="absolute top-[120px] left-4 w-72 bg-white rounded-lg shadow-lg border border-gray-300 p-4 space-y-2 z-50 text-left">
          <h2 className="text-base font-bold text-gray-800 mb-2">Município: {detalhesMunicipioClicado.nome}</h2>
          <div className="space-y-1">
            <p className="text-sm text-gray-800"><span className="font-semibold">Total de Eleitores:</span> {detalhesMunicipioClicado.metrics.totalEleitores.toLocaleString('pt-BR')}</p>
            {abaAtiva === 'Visão Geral' && (
              <>
                <p className="text-sm text-gray-800"><span className="font-semibold">Percentual de Mulheres:</span> {detalhesMunicipioClicado.metrics.percMulheres.toFixed(2)}% ({detalhesMunicipioClicado.metrics.totalMulheres.toLocaleString('pt-BR')} mulheres)</p>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Grupo Etário:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    { name: 'Jovens (16-24)', perc: detalhesMunicipioClicado.metrics.percJovens, total: detalhesMunicipioClicado.metrics.totalJovens },
                    { name: 'Adultos (25-59)', perc: detalhesMunicipioClicado.metrics.percAdultos, total: detalhesMunicipioClicado.metrics.totalAdultos },
                    { name: 'Idosos (60+)', perc: detalhesMunicipioClicado.metrics.percIdosos, total: detalhesMunicipioClicado.metrics.totalIdosos },
                  ].map((item, index) => (<li key={item.name || `vg-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
            {abaAtiva === 'Gênero' && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Gênero:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    { name: 'Masculino', perc: detalhesMunicipioClicado.metrics.percMasculino || 0, total: detalhesMunicipioClicado.metrics.totalMasculino || 0 },
                    { name: 'Feminino', perc: detalhesMunicipioClicado.metrics.percFeminino || 0, total: detalhesMunicipioClicado.metrics.totalFeminino || 0 },
                  ].map((item, index) => (<li key={item.name || `gen-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
            {abaAtiva === 'Estado Civil' && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Estado Civil:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    { name: 'Solteiros', perc: detalhesMunicipioClicado.metrics.percSolteiro || 0, total: detalhesMunicipioClicado.metrics.totalSolteiro || 0 },
                    { name: 'Casados', perc: detalhesMunicipioClicado.metrics.percCasado || 0, total: detalhesMunicipioClicado.metrics.totalCasado || 0 },
                    { name: 'Divorciados', perc: detalhesMunicipioClicado.metrics.percDivorciado || 0, total: detalhesMunicipioClicado.metrics.totalDivorciado || 0 },
                    { name: 'Viúvos', perc: detalhesMunicipioClicado.metrics.percViuvo || 0, total: detalhesMunicipioClicado.metrics.totalViuvo || 0 },
                    { name: 'Separados Judicialmente', perc: detalhesMunicipioClicado.metrics.percSeparadoJudicialmente || 0, total: detalhesMunicipioClicado.metrics.totalSeparadoJudicialmente || 0 },
                  ].map((item, index) => (<li key={item.name || `ec-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
            {abaAtiva === 'Faixa Etária' && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Faixa Etária:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    ...ALL_FAIXAS_ETARIAS_DETALHADAS_KEYS.map(key => {
                      const metricKey = `perc${key}` as keyof MapMunicipioMetrics;
                      const totalKey = `total${key}` as keyof MapMunicipioMetrics; // Chave para o total bruto
                      const name = ALL_FAIXAS_ETARIAS_LABELS_MAP[`perc${key}`];
                      return { name: name, perc: (detalhesMunicipioClicado.metrics[metricKey] as number) || 0, total: (detalhesMunicipioClicado.metrics[totalKey] as number) || 0 };
                    })
                  ].map((item, index) => (<li key={item.name || `fe-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
            {abaAtiva === 'Escolaridade' && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Escolaridade:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    { name: 'Analfabetos', perc: detalhesMunicipioClicado.metrics.percAnalfabetos || 0, total: detalhesMunicipioClicado.metrics.totalAnalfabetos || 0 },
                    { name: 'Lê e Escreve', perc: detalhesMunicipioClicado.metrics.percLeEscreve || 0, total: detalhesMunicipioClicado.metrics.totalLeEscreve || 0 },
                    { name: 'Fundamental Incompleto', perc: detalhesMunicipioClicado.metrics.percFundamentalIncompleto || 0, total: detalhesMunicipioClicado.metrics.totalFundamentalIncompleto || 0 },
                    { name: 'Fundamental Completo', perc: detalhesMunicipioClicado.metrics.percFundamentalCompleto || 0, total: detalhesMunicipioClicado.metrics.totalFundamentalCompleto || 0 },
                    { name: 'Médio Incompleto', perc: detalhesMunicipioClicado.metrics.percMedioIncompleto || 0, total: detalhesMunicipioClicado.metrics.totalMedioIncompleto || 0 },
                    { name: 'Médio Completo', perc: detalhesMunicipioClicado.metrics.percMedioCompleto || 0, total: detalhesMunicipioClicado.metrics.totalMedioCompleto || 0 },
                    { name: 'Superior Incompleto', perc: detalhesMunicipioClicado.metrics.percSuperiorIncompleto || 0, total: detalhesMunicipioClicado.metrics.totalSuperiorIncompleto || 0 },
                    { name: 'Superior Completo', perc: detalhesMunicipioClicado.metrics.percSuperiorCompleto || 0, total: detalhesMunicipioClicado.metrics.totalSuperiorCompleto || 0 },
                  ].map((item, index) => (<li key={item.name || `es-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
            {abaAtiva === 'Raça/Cor' && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Raça/Cor:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    { name: 'Branca', perc: detalhesMunicipioClicado.metrics.percBranca || 0, total: detalhesMunicipioClicado.metrics.totalBranca || 0 },
                    { name: 'Preta', perc: detalhesMunicipioClicado.metrics.percPreta || 0, total: detalhesMunicipioClicado.metrics.totalPreta || 0 },
                    { name: 'Parda', perc: detalhesMunicipioClicado.metrics.percParda || 0, total: detalhesMunicipioClicado.metrics.totalParda || 0 },
                    { name: 'Amarela', perc: detalhesMunicipioClicado.metrics.percAmarela || 0, total: detalhesMunicipioClicado.metrics.totalAmarela || 0 },
                    { name: 'Indígena', perc: detalhesMunicipioClicado.metrics.percIndigena || 0, total: detalhesMunicipioClicado.metrics.totalIndigena || 0 },
                    { name: 'Não Informada', perc: detalhesMunicipioClicado.metrics.percRacaCorNaoInformada || 0, total: detalhesMunicipioClicado.metrics.totalRacaCorNaoInformada || 0 },
                  ].map((item, index) => (<li key={item.name || `rc-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
            {abaAtiva === 'Identidade de Gênero' && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">Percentual por Identidade de Gênero:</h3>
                <ul className="list-none text-sm text-gray-800 ml-0 p-0 text-left mx-auto max-w-fit">
                  {[
                    { name: 'Transgênero', perc: detalhesMunicipioClicado.metrics.percTransgenero || 0, total: detalhesMunicipioClicado.metrics.totalTransgenero || 0 },
                    { name: 'Cisgênero', perc: detalhesMunicipioClicado.metrics.percCisgenero || 0, total: detalhesMunicipioClicado.metrics.totalCisgenero || 0 },
                    { name: 'Prefiro Não Dizer / Não Informado', perc: detalhesMunicipioClicado.metrics.percIdentidadeNaoInformada || 0, total: detalhesMunicipioClicado.metrics.totalIdentidadeNaoInformada || 0 },
                  ].map((item, index) => (<li key={item.name || `ig-${index}`}>{item.name}: {item.perc.toFixed(2)}% ({item.total.toLocaleString('pt-BR')})</li>))}
                </ul>
              </>
            )}
          </div>
          <button onClick={() => { setMunicipioClicadoInternamente(null); setDetalhesMunicipioClicado(null); }}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            Fechar Detalhes
          </button>
        </div>
      )}
    </div>
  );
};

export default MapaParaibaEleitorado;