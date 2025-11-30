import React, { useState, useMemo } from 'react';
import './App.css';
import playersData from './data/players.json';
import { calculateFinalValuation, formatCrores, getValueGrade } from './utils/valuationFormulas';
import { SquadProvider, useSquad } from './context/SquadContext';
import SquadBuilder from './pages/SquadBuilder';

function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('value-desc');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [notification, setNotification] = useState(null);

  const { squad, addPlayer } = useSquad();

  // Calculate valuations for all players
  const playersWithValuation = useMemo(() => {
    return playersData.map(player => ({
      ...player,
      valuation: calculateFinalValuation(player)
    }));
  }, []);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = playersWithValuation.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.team.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'All' || player.role === selectedRole;
      const matchesType = selectedType === 'All' || player.type === selectedType;
      
      return matchesSearch && matchesRole && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'value-desc':
          return b.valuation.finalValue - a.valuation.finalValue;
        case 'value-asc':
          return a.valuation.finalValue - b.valuation.finalValue;
        case 'war-desc':
          return b.valuation.war - a.valuation.war;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [playersWithValuation, searchTerm, selectedRole, selectedType, sortBy]);

  const handleAddToSquad = (player) => {
    const result = addPlayer(player);
    setNotification(result);
    setTimeout(() => setNotification(null), 3000);
  };

  const isInSquad = (playerId) => {
    return squad.some(p => p.id === playerId);
  };

  return (
    <div className="players-page">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.success ? 'success' : 'error'}`}>
          {notification.message}
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search players or teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            className="filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
          </select>

          <select 
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Indian">Indian</option>
            <option value="Overseas">Overseas</option>
          </select>

          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="value-desc">Highest Value</option>
            <option value="value-asc">Lowest Value</option>
            <option value="war-desc">Highest WAR</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      <div className="players-grid">
        {filteredPlayers.map(player => {
          const gradeInfo = getValueGrade(player.valuation.war);
          const inSquad = isInSquad(player.id);
          
          return (
            <div 
              key={player.id} 
              className={`player-card ${inSquad ? 'in-squad' : ''}`}
            >
              <div className="player-header">
                <div className="player-basic-info">
                  <h3 className="player-name">{player.name}</h3>
                  <div className="player-meta">
                    <span className="player-team">{player.team}</span>
                    <span className="player-age">{player.age}y</span>
                    <span className={`player-type ${player.type.toLowerCase()}`}>
                      {player.type}
                    </span>
                  </div>
                </div>
                <div className="player-role-badge" data-role={player.role.toLowerCase()}>
                  {player.role}
                </div>
              </div>

              <div className="player-valuation">
                <div className="valuation-main">
                  <span className="valuation-label">Valuation</span>
                  <span className="valuation-value">{formatCrores(player.valuation.finalValue)}</span>
                </div>
                
                <div className="war-indicator">
                  <div className="war-bar-container">
                    <div 
                      className="war-bar" 
                      style={{ 
                        width: `${Math.min(100, (player.valuation.war / 2.5) * 100)}%`,
                        backgroundColor: gradeInfo.color 
                      }}
                    />
                  </div>
                  <div className="war-details">
                    <span className="war-value">WAR: {player.valuation.war.toFixed(2)}</span>
                    <span className="war-grade" style={{ color: gradeInfo.color }}>
                      {gradeInfo.grade}
                    </span>
                  </div>
                </div>
              </div>

              <div className="player-stats-preview">
                {player.battingStats && (
                  <div className="stat-item">
                    <span className="stat-icon">🏏</span>
                    <span className="stat-text">{player.battingStats.runs} runs @ SR {player.battingStats.strikeRate}</span>
                  </div>
                )}
                {player.bowlingStats && (
                  <div className="stat-item">
                    <span className="stat-icon">⚡</span>
                    <span className="stat-text">{player.bowlingStats.wickets} wkts @ Eco {player.bowlingStats.economy}</span>
                  </div>
                )}
              </div>

              <div className="player-card-footer">
                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedPlayer(player)}
                >
                  View Details →
                </button>
                <button 
                  className={`add-squad-btn ${inSquad ? 'added' : ''}`}
                  onClick={() => handleAddToSquad(player)}
                  disabled={inSquad}
                >
                  {inSquad ? '✓ In Squad' : '+ Add to Squad'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="no-results">
          <p>No players found matching your criteria</p>
        </div>
      )}

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPlayer(null)}>×</button>
            
            <div className="modal-header">
              <div>
                <h2 className="modal-player-name">{selectedPlayer.name}</h2>
                <div className="modal-player-meta">
                  <span>{selectedPlayer.team}</span>
                  <span>•</span>
                  <span>{selectedPlayer.age} years</span>
                  <span>•</span>
                  <span>{selectedPlayer.role}</span>
                  <span>•</span>
                  <span className={`player-type ${selectedPlayer.type.toLowerCase()}`}>
                    {selectedPlayer.type}
                  </span>
                </div>
              </div>
              <div className="modal-valuation-box">
                <span className="modal-val-label">Estimated Value</span>
                <span className="modal-val-amount">{formatCrores(selectedPlayer.valuation.finalValue)}</span>
              </div>
            </div>

            <div className="modal-body">
              {/* Valuation Breakdown */}
              <section className="valuation-breakdown">
                <h3 className="section-title">Valuation Breakdown</h3>
                <div className="breakdown-grid">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Base Value (WAR × ₹2.5Cr)</span>
                    <span className="breakdown-value">{formatCrores(selectedPlayer.valuation.baseValue)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Confidence Adjusted</span>
                    <span className="breakdown-value">{formatCrores(selectedPlayer.valuation.adjustedBase)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Age Multiplier</span>
                    <span className="breakdown-value">{selectedPlayer.valuation.ageMultiplier}x</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Scarcity Multiplier</span>
                    <span className="breakdown-value">{selectedPlayer.valuation.scarcityMultiplier}x</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Form Multiplier</span>
                    <span className="breakdown-value">{selectedPlayer.valuation.formMultiplier}x</span>
                  </div>
                  <div className="breakdown-item highlight">
                    <span className="breakdown-label">WAR (Wins Above Replacement)</span>
                    <span className="breakdown-value">{selectedPlayer.valuation.war.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              {/* Performance Stats */}
              {selectedPlayer.battingStats && (
                <section className="stats-section">
                  <h3 className="section-title">Batting Performance</h3>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <span className="stat-box-label">Matches</span>
                      <span className="stat-box-value">{selectedPlayer.battingStats.matches}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Runs</span>
                      <span className="stat-box-value">{selectedPlayer.battingStats.runs}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Average</span>
                      <span className="stat-box-value">{selectedPlayer.battingStats.average}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Strike Rate</span>
                      <span className="stat-box-value">{selectedPlayer.battingStats.strikeRate}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Fours</span>
                      <span className="stat-box-value">{selectedPlayer.battingStats.fours}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Sixes</span>
                      <span className="stat-box-value">{selectedPlayer.battingStats.sixes}</span>
                    </div>
                  </div>
                </section>
              )}

              {selectedPlayer.bowlingStats && (
                <section className="stats-section">
                  <h3 className="section-title">Bowling Performance</h3>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <span className="stat-box-label">Matches</span>
                      <span className="stat-box-value">{selectedPlayer.bowlingStats.matches}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Wickets</span>
                      <span className="stat-box-value">{selectedPlayer.bowlingStats.wickets}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Economy</span>
                      <span className="stat-box-value">{selectedPlayer.bowlingStats.economy}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-box-label">Dot Ball %</span>
                      <span className="stat-box-value">{selectedPlayer.bowlingStats.dotBallPercentage}%</span>
                    </div>
                    {selectedPlayer.bowlingStats.deathOvers > 0 && (
                      <>
                        <div className="stat-box">
                          <span className="stat-box-label">Death Overs</span>
                          <span className="stat-box-value">{selectedPlayer.bowlingStats.deathOvers}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-box-label">Death Economy</span>
                          <span className="stat-box-value">{selectedPlayer.bowlingStats.deathEconomy}</span>
                        </div>
                      </>
                    )}
                    <div className="stat-box">
                      <span className="stat-box-label">Powerplay Wickets</span>
                      <span className="stat-box-value">{selectedPlayer.bowlingStats.powerplayWickets}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('players');
  const { squad, getRemainingPurse } = useSquad();

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">IPL Auction War Room</h1>
            <p className="app-subtitle">Advanced Player Valuation & Analytics</p>
          </div>
          <div className="stats-badges">
            <div className="stat-badge">
              <span className="stat-value">{playersData.length}</span>
              <span className="stat-label">Players</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{squad.length}</span>
              <span className="stat-label">In Squad</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{formatCrores(getRemainingPurse())}</span>
              <span className="stat-label">Budget Left</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="main-nav">
          <button 
            className={`nav-btn ${currentPage === 'players' ? 'active' : ''}`}
            onClick={() => setCurrentPage('players')}
          >
            Players Database
          </button>
          <button 
            className={`nav-btn ${currentPage === 'squad' ? 'active' : ''}`}
            onClick={() => setCurrentPage('squad')}
          >
            My Squad
            {squad.length > 0 && <span className="nav-badge">{squad.length}</span>}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {currentPage === 'players' ? <PlayersPage /> : <SquadBuilder />}
      </div>
    </div>
  );
}

function App() {
  return (
    <SquadProvider>
      <AppContent />
    </SquadProvider>
  );
}

export default App;
