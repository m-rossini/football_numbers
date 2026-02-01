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

    const homeGoals = record.home_score
    const awayGoals = record.away_score

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
      // Check if record already exists
      const existing = await db.get(
        'SELECT * FROM results WHERE date = ? AND homeTeam = ? AND awayTeam = ?',
        [result.date, result.homeTeam, result.awayTeam]
      );

      if (existing) {
        console.warn(
          `⚠️  DUPLICATE RECORD in results.csv at line ${lineNumber}: Record already exists`,
          `\n   Date: '${result.date}' (${result.date.length} chars)`,
          `\n   Home: '${result.homeTeam}' (${result.homeTeam.length} chars)`,
          `\n   Away: '${result.awayTeam}' (${result.awayTeam.length} chars)`
        );
        continue;
      }

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
      // Check if it's a UNIQUE constraint error and provide detailed diagnostics
      if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
        console.error(
          `❌ UNIQUE CONSTRAINT VIOLATION in results.csv at line ${lineNumber}`,
          `\n   Attempted: ${result.date} ${result.homeTeam} vs ${result.awayTeam}`,
          `\n   Values: date='${result.date}' (${result.date.length}), homeTeam='${result.homeTeam}' (${result.homeTeam.length}), awayTeam='${result.awayTeam}' (${result.awayTeam.length})`,
          `\n   Check for: whitespace, special characters, or duplicate rows in CSV`
        );
      } else {
        console.error(
          `❌ DATABASE ERROR in results.csv at line ${lineNumber}: ${result.date} ${result.homeTeam} vs ${result.awayTeam}`,
          err
        );
      }
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
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

    // Validate required fields
    const requiredFields = {
      date: record.date,
      home_team: record.home_team,
      away_team: record.away_team,
      scorer: record.scorer,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))
      .map(([field]) => field);

    if (missingFields.length > 0) {
      console.error(
        `❌ MISSING FIELD(S) in goalscorers.csv at line ${lineNumber}: [${missingFields.join(', ')}] - Record: ${JSON.stringify(record)}`
      );
      continue;
    }

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
      console.error(
        `❌ DATABASE ERROR in goalscorers.csv at line ${lineNumber}: Foreign key constraint failed`,
        `\n   Date: ${goalscorer.date}, Home: ${goalscorer.homeTeam}, Away: ${goalscorer.awayTeam}, Scorer: ${goalscorer.scorer}`,
        `\n   The result record (${goalscorer.date} ${goalscorer.homeTeam} vs ${goalscorer.awayTeam}) may not exist in results table`,
        `\n   Error:`,
        err
      );
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
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

    // Validate required fields
    const requiredFields = {
      date: record.date,
      home_team: record.home_team,
      away_team: record.away_team,
      winner: record.winner,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))
      .map(([field]) => field);

    if (missingFields.length > 0) {
      console.error(
        `❌ MISSING FIELD(S) in shootouts.csv at line ${lineNumber}: [${missingFields.join(', ')}] - Record: ${JSON.stringify(record)}`
      );
      continue;
    }

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
        `❌ DATABASE ERROR in shootouts.csv at line ${lineNumber}: Foreign key constraint failed`,
        `\n   Date: ${shootout.date}, Home: ${shootout.homeTeam}, Away: ${shootout.awayTeam}`,
        `\n   The result record (${shootout.date} ${shootout.homeTeam} vs ${shootout.awayTeam}) may not exist in results table`,
        `\n   Error:`,
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
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

    // Validate required field: name
    if (!record.name || !record.name.trim()) {
      console.error(
        `❌ MISSING FIELD(S) in former_names.csv at line ${lineNumber}: [name] - Record: ${JSON.stringify(record)}`
      );
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
      console.error(
        `❌ DATABASE ERROR in former_names.csv at line ${lineNumber}: Failed to insert`,
        `\n   Name: ${formerName.name}, Former Name: ${formerName.formerName || 'NULL'}`,
        `\n   Error:`,
        err
      );
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
