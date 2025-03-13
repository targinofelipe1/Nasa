import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";

interface RegionalIndicator {
  regional: string;
  municipios: string[];
}

export default function RegionalIndicators({
  data = [],
  setIsModalOpen,
}: {
  data?: any[];
  setIsModalOpen: (state: boolean) => void;
}) {
  const [indicators, setIndicators] = useState<RegionalIndicator[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const findKey = (columnName: string) =>
      Object.keys(data[0]).find(
        key => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.toLowerCase()
      ) || "";

    const municipioKey = findKey("Município");
    const rgaKey = findKey("RGA");

    if (!municipioKey || !rgaKey) return;

    const regionais: Record<string, string[]> = {};

    data.forEach(row => {
      const municipio = row[municipioKey]?.toString().trim();
      const rga = row[rgaKey]?.toString().trim().replace("ª", "");

      if (municipio && rga) {
        const nomeRegional = `${rga}ª Regional`;

        if (!regionais[nomeRegional]) {
          regionais[nomeRegional] = [];
        }

        regionais[nomeRegional].push(municipio);
      }
    });

    const formattedIndicators = Object.entries(regionais)
      .map(([regional, municipios]) => ({
        regional,
        municipios,
      }))
      .sort((a, b) => parseInt(a.regional) - parseInt(b.regional)); // 🔹 Ordenando pela numeração da regional

    setIndicators(formattedIndicators);
  }, [data]);

  return (
    <div className="mt-6 space-y-4 text-center">
      <h2 className="text-xl font-bold">Indicadores Regionais</h2>
      <p>Visualização detalhada dos municípios por regional.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map(({ regional, municipios }, index) => (
          <Card
            key={index}
            value={municipios.length}
            label={`${regional}`}
            modalContent={
              <div>
                <h3 className="text-lg font-bold mb-2">Municípios da {regional}</h3>
                <p className="text-gray-700">{municipios.join(", ")}</p>
              </div>
            }
            setIsModalOpen={setIsModalOpen}
          />
        ))}
      </div>
    </div>
  );
}
