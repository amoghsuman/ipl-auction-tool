import React, { createContext, useContext, useState, useEffect } from 'react';

const SquadContext = createContext();

export const useSquad = () => {
  const context = useContext(SquadContext);
  if (!context) {
    throw new Error('useSquad must be used within SquadProvider');
  }
  return context;
};

export const SquadProvider = ({ children }) => {
  const [squad, setSquad] = useState([]);
  const [totalPurse] = useState(120); // ₹120 Cr total purse
  const [maxSquadSize] = useState(25);
  const [maxOverseas] = useState(8);

  // Load squad from localStorage on mount
  useEffect(() => {
    const savedSquad = localStorage.getItem('iplSquad');
    if (savedSquad) {
      try {
        setSquad(JSON.parse(savedSquad));
      } catch (e) {
        console.error('Error loading squad:', e);
      }
    }
  }, []);

  // Save squad to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('iplSquad', JSON.stringify(squad));
  }, [squad]);

  const addPlayer = (player) => {
    if (squad.length >= maxSquadSize) {
      return { success: false, message: `Squad full! Maximum ${maxSquadSize} players allowed.` };
    }

    if (squad.find(p => p.id === player.id)) {
      return { success: false, message: 'Player already in squad!' };
    }

    const overseasCount = squad.filter(p => p.type === 'Overseas').length;
    if (player.type === 'Overseas' && overseasCount >= maxOverseas) {
      return { success: false, message: `Maximum ${maxOverseas} overseas players allowed!` };
    }

    const spentAmount = getSpentAmount();
    const remainingPurse = totalPurse - spentAmount;
    const minRequiredForRemaining = (maxSquadSize - squad.length - 1) * 0.2; // Min ₹20L per remaining slot

    if (player.valuation.finalValue > remainingPurse - minRequiredForRemaining) {
      return { 
        success: false, 
        message: `Not enough budget! Need to reserve ₹${minRequiredForRemaining.toFixed(2)}Cr for remaining slots.` 
      };
    }

    setSquad([...squad, player]);
    return { success: true, message: `${player.name} added to squad!` };
  };

  const removePlayer = (playerId) => {
    setSquad(squad.filter(p => p.id !== playerId));
    return { success: true, message: 'Player removed from squad.' };
  };

  const clearSquad = () => {
    setSquad([]);
    return { success: true, message: 'Squad cleared!' };
  };

  const getSpentAmount = () => {
    return squad.reduce((total, player) => total + player.valuation.finalValue, 0);
  };

  const getRemainingPurse = () => {
    return totalPurse - getSpentAmount();
  };

  const getSquadComposition = () => {
    const composition = {
      total: squad.length,
      indian: squad.filter(p => p.type === 'Indian').length,
      overseas: squad.filter(p => p.type === 'Overseas').length,
      batsmen: squad.filter(p => p.role === 'Batsman').length,
      bowlers: squad.filter(p => p.role === 'Bowler').length,
      allRounders: squad.filter(p => p.role === 'All-Rounder').length,
    };
    return composition;
  };

  const getSquadGaps = () => {
    const composition = getSquadComposition();
    const gaps = [];

    // Death bowlers check (need at least 2)
    const deathBowlers = squad.filter(p => 
      p.bowlingStats && p.bowlingStats.deathOvers > 30
    ).length;
    if (deathBowlers < 2) {
      gaps.push({
        priority: 'CRITICAL',
        category: 'Death Bowling',
        current: deathBowlers,
        needed: 2,
        description: 'Need specialist death bowlers'
      });
    }

    // Opening batsmen check (need at least 2)
    const openers = squad.filter(p => 
      p.battingStats && p.battingStats.strikeRate > 130
    ).length;
    if (openers < 2) {
      gaps.push({
        priority: 'HIGH',
        category: 'Opening Batsmen',
        current: openers,
        needed: 2,
        description: 'Need quality opening batsmen'
      });
    }

    // Spinners check (need at least 2)
    const spinners = squad.filter(p => 
      p.role === 'Bowler' && p.bowlingStats && p.bowlingStats.economy < 8
    ).length;
    if (spinners < 2) {
      gaps.push({
        priority: 'MEDIUM',
        category: 'Spin Bowling',
        current: spinners,
        needed: 2,
        description: 'Need quality spinners'
      });
    }

    // All-rounders check (need at least 2)
    if (composition.allRounders < 2) {
      gaps.push({
        priority: 'MEDIUM',
        category: 'All-Rounders',
        current: composition.allRounders,
        needed: 2,
        description: 'Need all-round options for balance'
      });
    }

    // Wicket-keeper batsman check
    const keepers = squad.filter(p => 
      p.battingStats && (p.name.toLowerCase().includes('pant') || 
                         p.name.toLowerCase().includes('samson') ||
                         p.name.toLowerCase().includes('kishan') ||
                         p.name.toLowerCase().includes('dhoni'))
    ).length;
    if (keepers < 1) {
      gaps.push({
        priority: 'CRITICAL',
        category: 'Wicket-Keeper',
        current: keepers,
        needed: 1,
        description: 'Need at least one keeper-batsman'
      });
    }

    return gaps.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getBestXI = () => {
    if (squad.length < 11) {
      return null;
    }

    // Simple XI selection logic
    const xi = {
      openers: [],
      middleOrder: [],
      allRounders: [],
      bowlers: [],
      keeper: null
    };

    // Select keeper
    const keepers = squad.filter(p => 
      p.battingStats && (p.name.toLowerCase().includes('pant') || 
                         p.name.toLowerCase().includes('samson') ||
                         p.name.toLowerCase().includes('kishan'))
    );
    if (keepers.length > 0) {
      xi.keeper = keepers[0];
    }

    // Select top batsmen (excluding keeper)
    const batsmen = squad
      .filter(p => p.role === 'Batsman' && p.id !== xi.keeper?.id)
      .sort((a, b) => b.valuation.war - a.valuation.war)
      .slice(0, 5);
    
    xi.openers = batsmen.slice(0, 2);
    xi.middleOrder = batsmen.slice(2, 5);

    // Select all-rounders
    xi.allRounders = squad
      .filter(p => p.role === 'All-Rounder')
      .sort((a, b) => b.valuation.war - a.valuation.war)
      .slice(0, 2);

    // Select bowlers
    const bowlersNeeded = 11 - (xi.openers.length + xi.middleOrder.length + 
                                 xi.allRounders.length + (xi.keeper ? 1 : 0));
    xi.bowlers = squad
      .filter(p => p.role === 'Bowler')
      .sort((a, b) => b.valuation.war - a.valuation.war)
      .slice(0, bowlersNeeded);

    // Check overseas count
    const overseasInXI = [
      ...xi.openers,
      ...xi.middleOrder,
      ...xi.allRounders,
      ...xi.bowlers,
      xi.keeper
    ].filter(p => p && p.type === 'Overseas').length;

    return {
      players: xi,
      overseasCount: overseasInXI,
      isValid: overseasInXI <= 4,
      totalPlayers: (xi.openers.length + xi.middleOrder.length + 
                     xi.allRounders.length + xi.bowlers.length + 
                     (xi.keeper ? 1 : 0))
    };
  };

  const value = {
    squad,
    totalPurse,
    maxSquadSize,
    maxOverseas,
    addPlayer,
    removePlayer,
    clearSquad,
    getSpentAmount,
    getRemainingPurse,
    getSquadComposition,
    getSquadGaps,
    getBestXI,
  };

  return (
    <SquadContext.Provider value={value}>
      {children}
    </SquadContext.Provider>
  );
};
