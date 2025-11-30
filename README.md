# IPL Auction War Room 🏏

Advanced Player Valuation & Analytics Tool for IPL Auctions

## Overview

This tool provides data-driven player valuations using the **Wins Above Replacement (WAR)** methodology, helping IPL teams make informed auction decisions.

## Features

### Phase 1: Core MVP ✅
- **Player Database**: 25 real IPL 2024 players with comprehensive statistics
- **WAR-Based Valuation**: Calculates player worth using advanced metrics
- **Search & Filters**: Filter by role, type, and search by name/team
- **Player Cards**: Quick overview with valuation, WAR, and key stats
- **Detailed View**: Complete breakdown of valuation methodology

## Valuation Methodology

### Key Formulas

**For Batsmen:**
```
Batting Runs Created (BRC) = 
  Actual Runs + Boundary Bonus + Strike Rate Bonus + Situational Bonus + Pressure Bonus

WAR = (BRC - Replacement Level) / Runs per Win
```

**For Bowlers:**
```
Bowling Runs Saved (BRS) = 
  Runs Saved from Economy + Wicket Value + Death Bowling Bonus + Powerplay Bonus

WAR = (BRS - Replacement Level) / Runs per Win
```

**For All-Rounders:**
```
WAR = (Batting WAR + Bowling WAR) × 1.17 (flexibility premium)
```

**Final Valuation:**
```
Value = Base Value × Age Adjustment × Scarcity Multiplier × Form Multiplier
```

### Valuation Components

1. **Base Value**: WAR × ₹7 Cr (market rate per WAR)
2. **Confidence Adjustment**: Based on sample size (matches played)
3. **Age Multiplier**: Peak age bonuses, decline factors
4. **Scarcity Multiplier**: Premium for rare skills (death bowling, Indian pace, etc.)
5. **Form Multiplier**: Recent performance trends

## Tech Stack

- **React 18**: Modern React with hooks
- **CSS3**: Custom design system with animations
- **Pure JavaScript**: No external dependencies for calculations

## Local Development

### Prerequisites
- Node.js 14+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ipl-auction-tool.git

# Navigate to directory
cd ipl-auction-tool

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Creates optimized production build in the `build/` folder.

## Deployment to Vercel

### Method 1: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Method 2: Via GitHub + Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ipl-auction-tool.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Deploy"
   - Your app will be live at: `https://your-project-name.vercel.app`

3. **Auto-Deploy:**
   - Every push to `main` branch auto-deploys to production
   - Pull requests create preview deployments

## Project Structure

```
ipl-auction-tool/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── data/
│   │   └── players.json          # Player database
│   ├── utils/
│   │   └── valuationFormulas.js  # WAR calculations
│   ├── App.js                    # Main component
│   ├── App.css                   # Styling
│   ├── index.js                  # Entry point
│   └── index.css                 # Base styles
├── package.json
└── README.md
```

## Player Data Structure

Each player includes:
- **Basic Info**: Name, team, role, type, age
- **Batting Stats**: Runs, average, SR, boundaries, high-pressure performance
- **Bowling Stats**: Wickets, economy, death overs, powerplay wickets
- **Calculated Fields**: WAR, valuation breakdowns

## Key Metrics Explained

### WAR (Wins Above Replacement)
Measures how many more wins a player provides compared to a minimum-salary replacement player.

### Scarcity Multipliers
- **Death Bowler (Indian)**: 1.5x
- **Quality Indian Pace**: 1.4x
- **Explosive Indian Batsman**: 1.35x
- **All-Rounders**: 1.17-1.3x

### Age Adjustments
- **Peak Years**: 
  - Fast bowlers: 26-29 (1.05x)
  - Batsmen: 27-32 (1.05x)
  - Spinners: 28-34 (1.05x)
- **Young Players**: Potential bonus up to 1.08x
- **Declining Years**: Discount from 0.97x to 0.85x

## Upcoming Features (Phase 2 & 3)

- Squad composition analysis
- Gap identification
- Budget tracker
- Real-time auction assistant
- Playing XI generator
- Team comparison tools

## Contributing

This is an early prototype. Suggestions and improvements welcome!

## License

MIT License

## Contact

Built by Amogh for Grant Thornton's Digital Solutions team.

---

**Note**: Player statistics are based on IPL 2024 performance data and are meant for demonstration purposes. For production use, integrate with live IPL data APIs.
