import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend);

interface LineChartProps {
  labels: string[];
  data: number[];
  label: string;
}

export const TrendLine: React.FC<LineChartProps> = ({ labels, data, label }) => (
  <Line
    data={{
      labels,
      datasets: [
        {
          label,
          data,
          fill: true,
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.15)',
          tension: 0.4,
        },
      ],
    }}
    options={{
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
    }}
  />
);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
}

export const StatusDoughnut: React.FC<DoughnutChartProps> = ({ labels, data }) => (
  <Doughnut
    data={{
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#0f766e', '#f97316', '#1f2937'],
          borderWidth: 0,
        },
      ],
    }}
    options={{
      plugins: { legend: { position: 'bottom' } },
    }}
  />
);

interface BarChartProps {
  labels: string[];
  data: number[];
}

export const PriorityBar: React.FC<BarChartProps> = ({ labels, data }) => (
  <Bar
    data={{
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#0f766e', '#eab308', '#ef4444'],
          borderRadius: 6,
        },
      ],
    }}
    options={{
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
    }}
  />
);
