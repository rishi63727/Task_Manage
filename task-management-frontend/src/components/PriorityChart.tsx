import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface ByPriority {
  low: number
  medium: number
  high: number
}

interface PriorityChartProps {
  byPriority: ByPriority
}

function PriorityChart({ byPriority }: PriorityChartProps) {
  const counts = [
    byPriority.low ?? 0,
    byPriority.medium ?? 0,
    byPriority.high ?? 0,
  ]

  const data = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        label: 'Tasks',
        data: counts,
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'x' as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...counts, 5),
      },
    },
  }

  return <Bar data={data} options={options} />
}

export default PriorityChart
