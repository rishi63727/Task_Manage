import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { DailyTrend } from '../api/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface TrendChartProps {
  dailyTrends: DailyTrend[]
}

function TrendChart({ dailyTrends }: TrendChartProps) {
  const labels = dailyTrends.map((d) => d.date)
  const created = dailyTrends.map((d) => d.tasks_created)
  const completed = dailyTrends.map((d) => d.tasks_completed)

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks created',
        data: created,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Tasks completed',
        data: completed,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return <Line data={data} options={options} />
}

export default TrendChart
