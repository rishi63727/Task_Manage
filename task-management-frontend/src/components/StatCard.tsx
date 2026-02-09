import React from 'react';
import { formatNumber } from '../utils/format';

interface StatCardProps {
  label: string;
  value: number | string;
  helper?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, helper }) => (
  <div className="card stat-card">
    <p className="stat-label">{label}</p>
    <h2 className="stat-value">{typeof value === 'number' ? formatNumber(value) : value}</h2>
    {helper && <p className="stat-helper">{helper}</p>}
  </div>
);

export default StatCard;
