"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Fonction qui génère 31 points randomisés mais stylisés (courbe montante puis descendante)
function generateRandomData() {
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 0; i <= 30; i++) {
    // Label "Now" à l'avant-dernière position (index 29)
    if (i === 29) {
      labels.push("Now");
    } else {
      labels.push(i.toString().padStart(2, "0"));
    }

    // Algorithme pour simuler la forme de ton image (fausse tendance)
    let baseValue = 40;
    if (i <= 20) {
      baseValue += i * 1.8; // Ça monte jusqu'à l'index 20
    } else {
      baseValue += 20 * 1.8 - (i - 20) * 2.5; // Ça redescend après
    }

    // On ajoute un facteur random de +/- 3 pour que ce soit vivant mais pas chaotique
    const randomNoise = (Math.random() - 0.5) * 6;
    data.push(Math.max(10, Math.round(baseValue + randomNoise)));
  }

  return { labels, data };
}

export default function RevenueGrowthChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Génération des fausses données au montage du composant
    const { labels, data } = generateRandomData();

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Dégradé orange sous la courbe
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(235, 104, 25, 0.15)");
    gradient.addColorStop(1, "rgba(235, 104, 25, 0.00)");

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: "#eb6819",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.1, // Garde les lignes semi-tendues de ton screen
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 31,
              color: (context) => {
                return context.tick.label === "Now" ? "#eb6819" : "#b5b5b5";
              },
              font: { size: 11 },
            },
          },
          y: {
            display: false,
            grid: { display: false },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, []); // Tableau de dépendances vide = s'exécute une seule fois au chargement

  return (
    <div style={{ width: "100%", height: "200px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
