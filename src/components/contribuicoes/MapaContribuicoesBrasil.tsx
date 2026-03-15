"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { MapPin, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

type ContribuicaoItem = {
  id: string;
  userId: string;
  usuario: string;
  cidade: string;
  tipo: string;
  localizacao?: string;
  descricao: string;
  quantidade: string;
  imagemUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type MapaContribuicoesBrasilProps = {
  contribuicoes: ContribuicaoItem[];
};

type GeoFeature = {
  rsmKey: string;
  properties?: {
    name?: string;
    sigla?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type GeographiesRenderProps = {
  geographies: GeoFeature[];
};

type SelectedInfo =
  | {
      tipo: "estado";
      nome: string;
      total: number;
    }
  | null;

const geoUrl =
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson";

function normalizarTexto(valor: string) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function MapaContribuicoesBrasil({
  contribuicoes,
}: MapaContribuicoesBrasilProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [-54, -15],
    zoom: 1,
  });
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo>(null);

  const totaisPorEstado = useMemo(() => {
    const mapa = new Map<string, number>();

    for (const item of contribuicoes) {
      const localBase = `${item.cidade || ""} ${item.localizacao || ""}`;
      const localNormalizado = normalizarTexto(localBase);

      let sigla = "";

      const match = localBase.match(/\b([A-Z]{2})\b/);
      if (match?.[1]) {
        sigla = match[1].toUpperCase();
      } else {
        const estados: Record<string, string> = {
          acre: "AC",
          alagoas: "AL",
          amapa: "AP",
          amazonas: "AM",
          bahia: "BA",
          ceara: "CE",
          "distrito federal": "DF",
          "espirito santo": "ES",
          goias: "GO",
          maranhao: "MA",
          "mato grosso": "MT",
          "mato grosso do sul": "MS",
          "minas gerais": "MG",
          para: "PA",
          paraiba: "PB",
          parana: "PR",
          pernambuco: "PE",
          piaui: "PI",
          "rio de janeiro": "RJ",
          "rio grande do norte": "RN",
          "rio grande do sul": "RS",
          rondonia: "RO",
          roraima: "RR",
          "santa catarina": "SC",
          "sao paulo": "SP",
          sergipe: "SE",
          tocantins: "TO",
        };

        for (const [nome, uf] of Object.entries(estados)) {
          if (localNormalizado.includes(nome)) {
            sigla = uf;
            break;
          }
        }
      }

      if (!sigla) continue;

      mapa.set(sigla, (mapa.get(sigla) || 0) + 1);
    }

    return mapa;
  }, [contribuicoes]);

  const totalEstadosComContribuicao = useMemo(() => {
    return Array.from(totaisPorEstado.values()).filter((total) => total > 0).length;
  }, [totaisPorEstado]);

  const handleZoomIn = () => {
    const nextZoom = Math.min(position.zoom + 0.5, 8);
    setZoom(nextZoom);
    setPosition((prev) => ({ ...prev, zoom: nextZoom }));
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(position.zoom - 0.5, 1);
    setZoom(nextZoom);
    setPosition((prev) => ({ ...prev, zoom: nextZoom }));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({
      coordinates: [-54, -15],
      zoom: 1,
    });
    setSelectedInfo(null);
  };

  return (
    <div className="relative h-96 overflow-hidden rounded-xl border border-green-100 bg-[#F7FBF7]">
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="rounded-lg bg-white p-2 shadow hover:bg-gray-50"
          title="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4 text-gray-700" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="rounded-lg bg-white p-2 shadow hover:bg-gray-50"
          title="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4 text-gray-700" />
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg bg-white p-2 shadow hover:bg-gray-50"
          title="Resetar mapa"
        >
          <RotateCcw className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {selectedInfo ? (
        <div className="absolute left-3 top-3 z-20 max-w-xs rounded-xl bg-white/95 px-4 py-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Estado
          </p>
          <p className="mt-1 text-sm font-bold text-gray-900">{selectedInfo.nome}</p>
          <p className="mt-1 text-sm text-gray-600">
            {selectedInfo.total} contribuição{selectedInfo.total > 1 ? "ões" : ""}
          </p>
        </div>
      ) : (
        <div className="absolute left-3 top-3 z-20 max-w-xs rounded-xl bg-white/95 px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900">
            Clique em um estado para ver os detalhes
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Estados com contribuições aparecem em verde mais escuro.
          </p>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-54, -15],
          scale: 650,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={(pos: { coordinates: [number, number]; zoom: number }) => {
            setPosition(pos);
            setZoom(pos.zoom);
          }}
        >
          <Geographies geography={geoUrl}>
            {(geographiesData: GeographiesRenderProps) =>
              geographiesData.geographies.map((geo: GeoFeature) => {
                const nomeEstado = String(
                  geo.properties?.name || geo.properties?.sigla || "Estado"
                );
                const siglaEstado = String(geo.properties?.sigla || "");
                const totalEstado = totaisPorEstado.get(siglaEstado) || 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo as any}
                    onClick={() =>
                      setSelectedInfo({
                        tipo: "estado",
                        nome: nomeEstado,
                        total: totalEstado,
                      })
                    }
                    style={{
                      default: {
                        fill: totalEstado > 0 ? "#66BB6A" : "#C8E6C9",
                        stroke: "#FFFFFF",
                        strokeWidth: 0.8,
                        outline: "none",
                        cursor: "pointer",
                      },
                      hover: {
                        fill: totalEstado > 0 ? "#43A047" : "#A5D6A7",
                        stroke: "#FFFFFF",
                        strokeWidth: 0.8,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: totalEstado > 0 ? "#2E7D32" : "#81C784",
                        stroke: "#FFFFFF",
                        strokeWidth: 0.8,
                        outline: "none",
                        cursor: "pointer",
                      },
                    }}
                  >
                    <title>
                      {nomeEstado} — {totalEstado} contribuição
                      {totalEstado > 1 ? "ões" : ""}
                    </title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {totalEstadosComContribuicao === 0 ? (
        <div className="absolute inset-x-0 bottom-14 flex justify-center px-6">
          <div className="rounded-xl bg-white/90 px-6 py-4 text-center shadow">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4" />
              Nenhum estado com contribuições identificadas no momento.
            </div>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-700 shadow">
        Zoom: {zoom.toFixed(1)}x • {totalEstadosComContribuicao} estado
        {totalEstadosComContribuicao > 1 ? "s" : ""} com contribuições
      </div>
    </div>
  );
}