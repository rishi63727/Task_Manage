import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: string
  color: 'blue' | 'orange' | 'green' | 'red'
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorMap = {
    blue: '#3b82f6',
    orange: '#f59e0b',
    green: '#10b981',
    red: '#ef4444',
  }

  return (
    <div className={styles.card}>
      <div className={styles.icon} style={{ backgroundColor: colorMap[color] }}>
        {color === 'blue' && '📊'}
        {color === 'orange' && '⚡'}
        {color === 'green' && '✓'}
        {color === 'red' && '⚠️'}
      </div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  )
}

export default StatCard
