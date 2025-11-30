import React, { useState } from 'react';
import { useSquad } from '../context/SquadContext';
import { formatCrores } from '../utils/valuationFormulas';
import '../styles/SquadBuilder.css';

function SquadBuilder() {
  const {
    squad,
    totalPurse,
    maxSquadSize,
    maxOverseas,
    removePlayer,
    clearSquad,
    getSpentAmount,
    getRemainingPurse,
    getSquadComposition,
    getSquadGaps,
    getBestXI,
  } = useSquad();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const spentAmount = getSpentAmount();
  const remainingPurse = getRemainingPurse();
  const composition = getSquadComposition();
  const gaps = getSquadGaps();
  const bestXI = getBestXI();

  const handleClearSquad = () => {
    clearSquad();
    setShowClearConfirm(false);
  };

  const getRoleBadgeClass = (role) => {
    return `role-badge role-${role.toLowerCase().replace('-', '')}`;
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  return (
    <div className="squad-builder">
      {/* Header Stats */}
      <div className="squad-stats-header">
        <div className="stat-card">
          <span className="stat-label">Total Purse</span>
          <span className="stat-value">{formatCrores(totalPurse)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Spent</span>
          <span className="stat-value spent">{formatCrores(spentAmount)}</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{formatCrores(remainingPurse)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Players</span>
          <span className="stat-value">{composition.total}/{maxSquadSize}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Overseas</span>
          <span className="stat-value">{composition.overseas}/{maxOverseas}</span>
        </div>
      </div>

      <div className="squad-content">
        {/* Left Column: Current Squad */}
        <div className="squad-section">
          <div className="section-header">
            <h2>My Squad ({squad.length})</h2>
            {squad.length > 0 && (
              <button 
                className="clear-btn"
                onClick={() => setShowClearConfirm(true)}
              >
                Clear All
              </button>
            )}
          </div>

          {squad.length === 0 ? (
            <div className="empty-state">
              <p>Your squad is empty</p>
              <p className="hint">Go to Players page to add players to your squad</p>
            </div>
          ) : (
            <div className="squad-list">
              {squad.map((player) => (
                <div key={player.id} className="squad-player-card">
                  <div className="player-info">
                    <div className="player-header">
                      <h3>{player.name}</h3>
                      <span className={`type-badge ${player.type.toLowerCase()}`}>
                        {player.type}
                      </span>
                    </div>
                    <div className="player-meta">
                      <span className="team">{player.team}</span>
                      <span className="age">{player.age}y</span>
                      <span className={getRoleBadgeClass(player.role)}>
                        {player.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="player-value">
                    <span className="value-label">Cost</span>
                    <span className="value-amount">
                      {formatCrores(player.valuation.finalValue)}
                    </span>
                  </div>

                  <button 
                    className="remove-btn"
                    onClick={() => removePlayer(player.id)}
                    title="Remove from squad"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Analysis */}
        <div className="analysis-section">
          {/* Squad Composition */}
          <div className="analysis-card">
            <h3>Squad Composition</h3>
            <div className="composition-grid">
              <div className="comp-item">
                <span className="comp-label">Batsmen</span>
                <span className="comp-value">{composition.batsmen}</span>
              </div>
              <div className="comp-item">
                <span className="comp-label">Bowlers</span>
                <span className="comp-value">{composition.bowlers}</span>
              </div>
              <div className="comp-item">
                <span className="comp-label">All-Rounders</span>
                <span className="comp-value">{composition.allRounders}</span>
              </div>
              <div className="comp-item">
                <span className="comp-label">Indians</span>
                <span className="comp-value">{composition.indian}</span>
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="analysis-card">
            <h3>Budget Analysis</h3>
            <div className="budget-breakdown">
              <div className="budget-bar">
                <div 
                  className="budget-filled"
                  style={{ width: `${(spentAmount / totalPurse) * 100}%` }}
                />
              </div>
              <div className="budget-details">
                <div className="budget-row">
                  <span>Slots Remaining:</span>
                  <span>{maxSquadSize - composition.total}</span>
                </div>
                <div className="budget-row">
                  <span>Min Reserve Needed:</span>
                  <span>{formatCrores((maxSquadSize - composition.total) * 0.2)}</span>
                </div>
                <div className="budget-row highlight">
                  <span>Available to Spend:</span>
                  <span>{formatCrores(Math.max(0, remainingPurse - (maxSquadSize - composition.total) * 0.2))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Squad Gaps */}
          <div className="analysis-card">
            <h3>Squad Gaps & Priorities</h3>
            {gaps.length === 0 ? (
              <p className="no-gaps">✓ Well-balanced squad!</p>
            ) : (
              <div className="gaps-list">
                {gaps.map((gap, index) => (
                  <div key={index} className={`gap-item ${getPriorityClass(gap.priority)}`}>
                    <div className="gap-header">
                      <span className="gap-priority">{gap.priority}</span>
                      <span className="gap-category">{gap.category}</span>
                    </div>
                    <div className="gap-description">{gap.description}</div>
                    <div className="gap-status">
                      Current: {gap.current} / Needed: {gap.needed}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Best XI */}
          {bestXI && bestXI.totalPlayers === 11 && (
            <div className="analysis-card">
              <h3>Best Playing XI</h3>
              <div className="xi-preview">
                {bestXI.players.keeper && (
                  <div className="xi-section">
                    <span className="xi-label">Keeper:</span>
                    <span className="xi-name">{bestXI.players.keeper.name}</span>
                  </div>
                )}
                {bestXI.players.openers.length > 0 && (
                  <div className="xi-section">
                    <span className="xi-label">Openers:</span>
                    <span className="xi-names">
                      {bestXI.players.openers.map(p => p.name).join(', ')}
                    </span>
                  </div>
                )}
                {bestXI.players.middleOrder.length > 0 && (
                  <div className="xi-section">
                    <span className="xi-label">Middle Order:</span>
                    <span className="xi-names">
                      {bestXI.players.middleOrder.map(p => p.name).join(', ')}
                    </span>
                  </div>
                )}
                {bestXI.players.allRounders.length > 0 && (
                  <div className="xi-section">
                    <span className="xi-label">All-Rounders:</span>
                    <span className="xi-names">
                      {bestXI.players.allRounders.map(p => p.name).join(', ')}
                    </span>
                  </div>
                )}
                {bestXI.players.bowlers.length > 0 && (
                  <div className="xi-section">
                    <span className="xi-label">Bowlers:</span>
                    <span className="xi-names">
                      {bestXI.players.bowlers.map(p => p.name).join(', ')}
                    </span>
                  </div>
                )}
                <div className="xi-footer">
                  <span className={bestXI.isValid ? 'valid' : 'invalid'}>
                    Overseas: {bestXI.overseasCount}/4 
                    {bestXI.isValid ? ' ✓' : ' ⚠️ Too many!'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Clear Squad?</h3>
            <p>Are you sure you want to remove all players from your squad?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleClearSquad}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SquadBuilder;
