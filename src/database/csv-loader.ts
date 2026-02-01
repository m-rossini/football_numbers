import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { FootballDatabase } from './database';
import { Result, Goalscorer, Shootout, FormerName } from './types';

/**
 * Load results from CSV file
 */
export async function loadResults(db: FootballDatabase, filePath: string): Promise<number> {
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  let count = 0;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

    // Validate required fields
    const requiredFields = {
      date: record.date,
      home_team: record.home_team,
      away_team: record.away_team,
      home_score: record.home_score,
      away_score: record.away_score,
      tournament: record.tournament,
      city: record.city,
      country: record.country,
      neutral: record.neutral,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))
      .map(([field]) => field);

    if (missingFields.length > 0) {
      console.error(
        `❌ MISSING FIELD(S) in results.csv at line ${lineNumber}: [${missingFields.join(', ')}] - Record: ${JSON.stringify(record)}`
      );
      continue;
    }

    // Parse scores, default to 0 if empty/invalid
    const homeGoals = record.home_score && record.home_score.trim() !== '' ? parseInt(record.home_score, 10) : 0;
    const awayGoals = record.away_score && record.away_score.trim() !== '' ? parseInt(record.away_score, 10) : 0;

    // Skip records with invalid scores (NaN)
    if (isNaN(homeGoals) || isNaN(awayGoals)) {
      console.error(
        `❌ INVALID SCORE(S) in results.csv at line ${lineNumber}: homeGoals=${record.home_score}, awayGoals=${record.away_score} - Record: ${JSON.stringify(record)}`
      );
      continue;
    }

    const result: Result = {
      date: record.date,
      homeTeam: record.home_team,
      awayTeam: record.away_team,
      homeGoals,
      awayGoals,
      tournament: record.tournament,
      city: record.city,
      country: record.country,
      neutral: record.neutral === 'TRUE' ? 1 : 0,
    };

    try {
      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.date,
          result.homeTeam,
          result.awayTeam,
          result.homeGoals,
          result.awayGoals,
          result.tournament,
          result.city,
          result.country,
          result.neutral,
        ]
      );
      count++;
    } catch (err) {
      console.error(
        `❌ DATABASE ERROR in results.csv at line ${lineNumber}: ${result.date} ${result.homeTeam} vs ${result.awayTeam}`,
        err
      );
    }
  }

  return count;
}

/**
 * Load goalscorers from CSV file
 */
export async function loadGoalscorers(db: FootballDatabase, filePath: string): Promise<number> {
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  let count = 0;
  for (const record of records) {
    const minuteValue = record.minute && record.minute.trim() ? parseInt(record.minute, 10) : null;
    const goalscorer: Goalscorer = {
      date: record.date,
      homeTeam: record.home_team,
      awayTeam: record.away_team,
      scorer: record.scorer,
      minute: minuteValue,
      ownGoal: record.own_goal === 'TRUE' ? 1 : 0,
      penalty: record.penalty === 'TRUE' ? 1 : 0,
    };

    try {
      await db.run(
        `INSERT INTO goalscorers (date, homeTeam, awayTeam, scorer, minute, ownGoal, penalty)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          goalscorer.date,
          goalscorer.homeTeam,
          goalscorer.awayTeam,
          goalscorer.scorer,
          goalscorer.minute,
          goalscorer.ownGoal,
          goalscorer.penalty,
        ]
      );
      count++;
    } catch (err) {
      console.error(`Failed to load goalscorer: ${goalscorer.date} ${goalscorer.scorer}`, err);
    }
  }

  return count;
}

/**
 * Load shootouts from CSV file
 */
export async function loadShootouts(db: FootballDatabase, filePath: string): Promise<number> {
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  let count = 0;
  for (const record of records) {
    const shootout: Shootout = {
      date: record.date,
      homeTeam: record.home_team,
      awayTeam: record.away_team,
      winner: record.winner,
    };

    try {
      await db.run(
        `INSERT INTO shootouts (date, homeTeam, awayTeam, winner)
         VALUES (?, ?, ?, ?)`,
        [shootout.date, shootout.homeTeam, shootout.awayTeam, shootout.winner]
      );
      count++;
    } catch (err) {
      console.error(
        `Failed to load shootout: ${shootout.date} ${shootout.homeTeam} vs ${shootout.awayTeam}`,
        err
      );
    }
  }

  return count;
}

/**
 * Load former team names from CSV file
 */
export async function loadFormerNames(db: FootballDatabase, filePath: string): Promise<number> {
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  let count = 0;
  for (const record of records) {
    // Skip rows with missing name or empty formerName
    if (!record.name || !record.name.trim()) {
      continue;
    }

    const formerNameValue = record.former_name && record.former_name.trim() ? record.former_name : null;
    const formerName: FormerName = {
      name: record.name,
      formerName: formerNameValue,
    };

    try {
      await db.run('INSERT INTO formerNames (name, formerName) VALUES (?, ?)', [
        formerName.name,
        formerName.formerName,
      ]);
      count++;
    } catch (err) {
      console.error(`Failed to load former name: ${formerName.name}`, err);
    }
  }

  return count;
}

/**
 * Load all data from CSV files
 */
export async function loadAllData(db: FootballDatabase, dataDir: string): Promise<void> {
  console.log('Loading football data from CSV files...');

  try {
    const resultsCount = await loadResults(db, `${dataDir}/results.csv`);
    console.log(`Loaded ${resultsCount} results`);

    const goalscorersCount = await loadGoalscorers(db, `${dataDir}/goalscorers.csv`);
    console.log(`Loaded ${goalscorersCount} goalscorers`);

    const shootoutsCount = await loadShootouts(db, `${dataDir}/shootouts.csv`);
    console.log(`Loaded ${shootoutsCount} shootouts`);

    const formerNamesCount = await loadFormerNames(db, `${dataDir}/former_names.csv`);
    console.log(`Loaded ${formerNamesCount} former team names`);

    console.log('Data loading complete');
  } catch (err) {
    console.error('Error loading data:', err);
    throw err;
  }
}
