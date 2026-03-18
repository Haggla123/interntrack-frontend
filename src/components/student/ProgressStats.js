import React from 'react';

const ProgressStats = ({ completedWeeks, totalWeeks }) => {
  // guard against totalWeeks = 0 to prevent NaN progress bar
  const safeTotal  = totalWeeks > 0 ? totalWeeks : 6;
  const percentage = Math.min(Math.round((completedWeeks / safeTotal) * 100), 100);

  return (
    <div className="stats-row">
      <div className="stat-card">
        <label>Overall Progress</label>
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
        <p>{completedWeeks} of {safeTotal} Weeks Completed</p>
      </div>

      <div className="stat-card">
        <label>Current Status</label>
        <p className="status-text">Active Placement</p>
      </div>
    </div>
  );
};

export default ProgressStats;