// IPL Player Valuation Formulas
// Based on the comprehensive valuation methodology

// Constants
const RUNS_PER_WIN = 22; // Empirically derived for T20 cricket
const MARKET_RATE_PER_WAR = 7; // Crores per WAR (updated annually)
const MATCHES_PER_SEASON = 14; // Standard IPL season
const REPLACEMENT_LEVEL_BATSMAN_PER_MATCH = 20; // Runs equivalent per match for replacement player
const REPLACEMENT_LEVEL_BOWLER_PER_MATCH = 12; // Runs saved per match for replacement bowler
const WICKET_VALUE = 16; // Runs per wicket in T20

// Age-based confidence levels
const getConfidenceLevel = (matches) => {
  if (matches >= 50) return 0.95; // 5+ seasons
  if (matches >= 30) return 0.80; // 3-4 seasons
  if (matches >= 14) return 0.60; // 1-2 seasons
  return 0.50; // Limited data
};

// Calculate Batting Runs Created (BRC) - Per Match Average
export const calculateBattingRunsCreated = (battingStats) => {
  if (!battingStats) return 0;

  const { runs, fours, sixes, strikeRate, runsInWins, highPressureRuns, matches } = battingStats;

  // Calculate per-match averages
  const runsPerMatch = runs / matches;
  const foursPerMatch = fours / matches;
  const sixesPerMatch = sixes / matches;
  const runsInWinsPerMatch = runsInWins / matches;
  const highPressureRunsPerMatch = highPressureRuns / matches;

  // Actual runs per match
  const actualRuns = runsPerMatch;

  // Boundary Bonus: (Boundaries × 0.5) per match
  const boundaryBonus = ((foursPerMatch + sixesPerMatch) * 0.5);

  // Strike Rate Bonus: If SR > 140, add bonus
  let srBonus = 0;
  if (strikeRate > 140) {
    const bonusPercentage = Math.min(0.12, (strikeRate - 140) / 1000);
    srBonus = runsPerMatch * bonusPercentage;
  }

  // Situational Bonus: Runs in winning causes weighted higher
  const situationalBonus = runsInWinsPerMatch * 0.15;

  // High-Pressure Bonus: Performance in close matches
  const pressureBonus = highPressureRunsPerMatch * 0.10;

  const brcPerMatch = actualRuns + boundaryBonus + srBonus + situationalBonus + pressureBonus;

  // Project to full season (14 matches)
  return brcPerMatch * MATCHES_PER_SEASON;
};

// Calculate Bowling Runs Saved (BRS) - Per Match Average
export const calculateBowlingRunsSaved = (bowlingStats) => {
  if (!bowlingStats) return 0;

  const { overs, economy, wickets, deathOvers, deathEconomy, powerplayWickets, matches } = bowlingStats;

  // Calculate per-match averages
  const oversPerMatch = overs / matches;
  const wicketsPerMatch = wickets / matches;
  const deathOversPerMatch = deathOvers / matches;
  const powerplayWicketsPerMatch = powerplayWickets / matches;

  // Calculate expected runs vs actual runs conceded per match
  const leagueAverageEconomy = 9.0; // IPL average
  const expectedRuns = oversPerMatch * leagueAverageEconomy;
  const actualRuns = oversPerMatch * economy;
  const runsSavedFromEconomy = expectedRuns - actualRuns;

  // Wicket value per match
  const wicketValue = wicketsPerMatch * WICKET_VALUE;

  // Death bowling premium (if applicable) per match
  let deathBowlingBonus = 0;
  if (deathOversPerMatch > 0) {
    const deathLeagueAvg = 10.5;
    const deathRunsSaved = (deathLeagueAvg - deathEconomy) * deathOversPerMatch;
    deathBowlingBonus = deathRunsSaved * 0.3; // 30% premium for death bowling
  }

  // Powerplay wickets bonus per match
  const powerplayBonus = powerplayWicketsPerMatch * 5; // Extra value for powerplay wickets

  const brsPerMatch = runsSavedFromEconomy + wicketValue + deathBowlingBonus + powerplayBonus;

  // Project to full season (14 matches)
  return brsPerMatch * MATCHES_PER_SEASON;
};

// Calculate All-Rounder combined value
export const calculateAllRounderValue = (battingStats, bowlingStats) => {
  const battingWAR = calculateBattingWAR(battingStats);
  const bowlingWAR = calculateBowlingWAR(bowlingStats);
  
  // All-rounder flexibility premium: 15-20%
  const flexibilityPremium = 1.17;
  
  return (battingWAR + bowlingWAR) * flexibilityPremium;
};

// Calculate Batting WAR
export const calculateBattingWAR = (battingStats) => {
  if (!battingStats) return 0;

  const brc = calculateBattingRunsCreated(battingStats);
  const replacementLevelSeason = REPLACEMENT_LEVEL_BATSMAN_PER_MATCH * MATCHES_PER_SEASON;
  
  // Runs Above Replacement
  const rar = brc - replacementLevelSeason;
  
  // Convert to WAR
  const war = rar / RUNS_PER_WIN;
  
  return Math.max(0, war); // Ensure non-negative
};

// Calculate Bowling WAR
export const calculateBowlingWAR = (bowlingStats) => {
  if (!bowlingStats) return 0;

  const brs = calculateBowlingRunsSaved(bowlingStats);
  const replacementLevelSeason = REPLACEMENT_LEVEL_BOWLER_PER_MATCH * MATCHES_PER_SEASON;
  
  // Runs Above Replacement
  const rar = brs - replacementLevelSeason;
  
  // Convert to WAR
  const war = rar / RUNS_PER_WIN;
  
  return Math.max(0, war); // Ensure non-negative
};

// Calculate Base Value in Crores
export const calculateBaseValue = (player) => {
  let war = 0;

  if (player.role === 'Batsman') {
    war = calculateBattingWAR(player.battingStats);
  } else if (player.role === 'Bowler') {
    war = calculateBowlingWAR(player.bowlingStats);
  } else if (player.role === 'All-Rounder') {
    war = calculateAllRounderValue(player.battingStats, player.bowlingStats);
  }

  // Base Value = WAR × Market Rate
  const baseValue = war * MARKET_RATE_PER_WAR;

  return baseValue;
};

// Apply confidence adjustment based on sample size
export const calculateAdjustedValue = (player, baseValue) => {
  const matches = player.battingStats?.matches || player.bowlingStats?.matches || 0;
  const confidence = getConfidenceLevel(matches);
  const leagueAverage = 5; // Crores

  // Adjusted Value = (Base Value × Confidence) + (League Average × (1 - Confidence))
  const adjustedValue = (baseValue * confidence) + (leagueAverage * (1 - confidence));

  return adjustedValue;
};

// Calculate Scarcity Multiplier
export const calculateScarcityMultiplier = (player) => {
  const { role, type } = player;
  
  // Death bowling specialists (especially Indian)
  if (player.bowlingStats?.deathOvers > 50) {
    return type === 'Indian' ? 1.5 : 1.3;
  }
  
  // Quality Indian pace bowlers
  if (role === 'Bowler' && type === 'Indian' && player.bowlingStats?.wickets > 40) {
    return 1.4;
  }
  
  // Explosive Indian opening batsmen
  if (role === 'Batsman' && type === 'Indian' && player.battingStats?.strikeRate > 140) {
    return 1.35;
  }
  
  // Quality leg-spinners
  if (role === 'Bowler' && player.bowlingStats?.wickets > 45) {
    return 1.25;
  }
  
  // Indian all-rounders
  if (role === 'All-Rounder' && type === 'Indian') {
    return 1.3;
  }
  
  // Overseas all-rounders (abundant)
  if (role === 'All-Rounder' && type === 'Overseas') {
    return 0.95;
  }
  
  // Default
  return 1.0;
};

// Calculate Age Adjustment Factor
export const calculateAgeAdjustment = (age, role) => {
  let peakAgeMin, peakAgeMax;
  
  if (role === 'Bowler' && age < 30) {
    peakAgeMin = 26;
    peakAgeMax = 29;
  } else if (role === 'Bowler') {
    peakAgeMin = 26;
    peakAgeMax = 32;
  } else if (role === 'Batsman') {
    peakAgeMin = 27;
    peakAgeMax = 32;
  } else {
    peakAgeMin = 27;
    peakAgeMax = 31;
  }
  
  if (age >= peakAgeMin && age <= peakAgeMax) {
    return 1.05; // At peak
  } else if (age < peakAgeMin) {
    return 1.0 + ((peakAgeMin - age) * 0.02); // Young and improving
  } else {
    return Math.max(0.85, 1.0 - ((age - peakAgeMax) * 0.03)); // Declining
  }
};

// Final Valuation with all adjustments
export const calculateFinalValuation = (player) => {
  // Step 1: Base Performance Value
  const baseValue = calculateBaseValue(player);
  
  // Step 2: Confidence Adjustment
  const adjustedBase = calculateAdjustedValue(player, baseValue);
  
  // Step 3: Age Adjustment
  const ageMultiplier = calculateAgeAdjustment(player.age, player.role);
  const ageAdjustedValue = adjustedBase * ageMultiplier;
  
  // Step 4: Scarcity Multiplier
  const scarcityMultiplier = calculateScarcityMultiplier(player);
  const scarcityAdjustedValue = ageAdjustedValue * scarcityMultiplier;
  
  // Step 5: Form multiplier (simplified - using strike rate/economy as proxy)
  let formMultiplier = 1.0;
  if (player.battingStats?.strikeRate > 150) formMultiplier = 1.1;
  if (player.bowlingStats?.economy < 7.5) formMultiplier = 1.1;
  
  const finalValue = scarcityAdjustedValue * formMultiplier;
  
  return {
    finalValue: Math.round(finalValue * 100) / 100,
    war: player.role === 'All-Rounder' 
      ? calculateAllRounderValue(player.battingStats, player.bowlingStats)
      : player.role === 'Batsman' 
        ? calculateBattingWAR(player.battingStats)
        : calculateBowlingWAR(player.bowlingStats),
    baseValue: Math.round(baseValue * 100) / 100,
    adjustedBase: Math.round(adjustedBase * 100) / 100,
    ageMultiplier: Math.round(ageMultiplier * 100) / 100,
    scarcityMultiplier: Math.round(scarcityMultiplier * 100) / 100,
    formMultiplier: Math.round(formMultiplier * 100) / 100
  };
};

// Helper: Format currency in Crores
export const formatCrores = (value) => {
  return `₹${value.toFixed(2)} Cr`;
};

// Helper: Get value grade
export const getValueGrade = (war) => {
  if (war >= 2.0) return { grade: 'Elite', color: '#10b981' };
  if (war >= 1.5) return { grade: 'Very Good', color: '#3b82f6' };
  if (war >= 1.0) return { grade: 'Good', color: '#8b5cf6' };
  if (war >= 0.5) return { grade: 'Average', color: '#f59e0b' };
  return { grade: 'Below Average', color: '#ef4444' };
};