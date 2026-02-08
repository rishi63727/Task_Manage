import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface TaskDistributionChartProps {
  completed: number
  pending: number
}

function TaskDistributionChart({ completed, pending }: TaskDistributionChartProps) {
  const data = {
    labels: ['Completed', 'To Do'],
    datasets: [
      {
        data: [completed, pending],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderColor: ['#fff'],
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom' as const },
    },
  }

  return <Pie data={data} options={options} />
}

export default TaskDistributionChart
