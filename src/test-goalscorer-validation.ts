import { FootballDatabase } from './database/database';
import { loadResults, loadGoalscorers } from './database/csv-loader';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

async function testGoalscorers() {
  const db = new FootballDatabase(':memory:');
  
  // Create temp CSV files with test data
  const tmpDir = tmpdir();
  
  // Create results CSV
  const resultsCsv = `date,home_team,away_team,home_score,away_score,tournament,city,country,neutral
1993-06-02,Belgium,Germany,0,2,World Cup Qualifier,Brussels,Belgium,1
1993-06-16,Germany,Bulgaria,0,0,World Cup Qualifier,Munich,Germany,0
2025-12-29,Morocco,Egypt,0,0,African Cup,Cairo,Egypt,0`;

  // Create goalscorers CSV with intentional mismatches to test diagnostics
  const goalscorersCSV = `date,home_team,away_team,scorer,minute,own_goal,penalty
1993-06-02,Belgium,Germany,Stefan Effenberg,31,FALSE,FALSE
1993-06-02,Belgium,Germany,Rudi Völler,76,FALSE,FALSE
1993-06-16,Germany,Bulgaria,Matthias Sammer,45,FALSE,FALSE
1993-06-16,Germany,Bulgaria2,Jürgen Klinsmann,89,FALSE,FALSE
2025-12-29,Morocco,Egypt,Karim Benzema,10,FALSE,FALSE`;

  const resultsPath = path.join(tmpDir, 'test-results.csv');
  const goalscorersPath = path.join(tmpDir, 'test-goalscorers.csv');

  fs.writeFileSync(resultsPath, resultsCsv);
  fs.writeFileSync(goalscorersPath, goalscorersCSV);

  try {
    await db.initialize();
    
    console.log('Loading results...');
    const resultsLoaded = await loadResults(db, resultsPath);
    console.log(`✓ Loaded ${resultsLoaded} results\n`);
    
    console.log('Loading goalscorers with validation...');
    const goalscorersLoaded = await loadGoalscorers(db, goalscorersPath);
    console.log(`\n✓ Loaded ${goalscorersLoaded} goalscorers\n`);

    // Check what was actually inserted
    const results = await db.all('SELECT * FROM results ORDER BY date');
    const goalscorers = await db.all('SELECT * FROM goalscorers ORDER BY date, scorer');
    
    console.log('=== Results in database ===');
    for (const r of results) {
      console.log(`${r.date}: ${r.homeTeam} vs ${r.awayTeam} (${r.homeGoals}-${r.awayGoals})`);
    }
    
    console.log('\n=== Goalscorers in database ===');
    for (const g of goalscorers) {
      console.log(`${g.date}: ${g.scorer} (${g.homeTeam} vs ${g.awayTeam})`);
    }

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await db.close();
    fs.unlinkSync(resultsPath);
    fs.unlinkSync(goalscorersPath);
  }
}

testGoalscorers().catch(console.error);
