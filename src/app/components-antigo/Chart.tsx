"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LogarithmicScale
} from "chart.js";
import { Line } from "react-chartjs-2";

// 🔹 Registra os módulos necessários
ChartJS.register(
  CategoryScale, // Corrige o erro "category is not a registered scale"
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend
);

const data = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
  datasets: [
    {
      label: "Indicador 1",
      data: [10, 20, 30, 25, 15, 40],
      borderColor: "blue",
      borderWidth: 2,
    },
  ],
};

export default function ChartComponent() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Gráfico de Indicadores</h2>
      <Line data={data} />
    </div>
  );
}
