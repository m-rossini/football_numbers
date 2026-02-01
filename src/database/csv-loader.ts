import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { FootballDatabase } from './database';
import { LoaderContext } from './types';

/**
 * Unified data loader for staging tables
 * Parses CSV, validates records, transforms data, and inserts into database
 */
export async function loadDataIntoStaging(db: FootballDatabase, context: LoaderContext): Promise<number> {
  const content = readFileSync(context.filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];

  let count = 0;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

    // Validate required fields
    const missingFields = context.requiredFields
      .filter(field => {
        const value = record[field];
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
      });

    if (missingFields.length > 0) {
      console.error(context.errorMessages.missingFields(lineNumber, missingFields, record));
      continue;
    }

    // Transform record to database values
    let dbValues: any[];
    try {
      const transformed = context.recordTransformer(record, lineNumber);
      if (transformed === null) {
        // Transformer returned null, skip this record (error was already logged)
        continue;
      }
      dbValues = transformed;
    } catch (err) {
      console.error(context.errorMessages.transformError(lineNumber, err, record));
      continue;
    }

    // Insert record
    try {
      await db.run(context.sqlStatement, dbValues);
      count++;
    } catch (err) {
      console.error(context.errorMessages.insertError(lineNumber, err, record));
    }
  }

  return count;
}

/**
 * Load results from CSV file
 */
export async function loadResults(db: FootballDatabase, filePath: string): Promise<number> {
  const context: LoaderContext = {
    fileName: 'results.csv',
    filePath,
    sqlStatement: `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    requiredFields: ['date', 'home_team', 'away_team', 'home_score', 'away_score', 'tournament', 'city', 'country', 'neutral'],
    recordTransformer: (record: any, lineNumber: number): any[] | null => {
      const homeGoals = parseInt(record.home_score, 10);
      const awayGoals = parseInt(record.away_score, 10);

      // Skip records with invalid scores (NaN)
      if (isNaN(homeGoals) || isNaN(awayGoals)) {
        console.error(
          `❌ INVALID SCORE(S) in results.csv at line ${lineNumber}: homeGoals=${record.home_score}, awayGoals=${record.away_score} - Record: ${JSON.stringify(record)}`
        );
        return null;
      }

      return [
        record.date,
        record.home_team,
        record.away_team,
        homeGoals,
        awayGoals,
        record.tournament,
        record.city,
        record.country,
        record.neutral === 'TRUE' ? 1 : 0,
      ];
    },
    errorMessages: {
      missingFields: (lineNumber: number, fields: string[], record: any) =>
        `❌ MISSING FIELD(S) in results.csv at line ${lineNumber}: [${fields.join(', ')}] - Record: ${JSON.stringify(record)}`,
      transformError: (lineNumber: number, error: any, _record: any) =>
        `❌ TRANSFORM ERROR in results.csv at line ${lineNumber}: ${error.message}`,
      insertError: (lineNumber: number, _error: any, record: any) =>
        `❌ DATABASE ERROR in results.csv at line ${lineNumber}: ${record.date} ${record.home_team} vs ${record.away_team}`,
    },
  };

  return loadDataIntoStaging(db, context);
}

/**
 * Load goalscorers from CSV file
 */
export async function loadGoalscorers(db: FootballDatabase, filePath: string): Promise<number> {
  const context: LoaderContext = {
    fileName: 'goalscorers.csv',
    filePath,
    sqlStatement: `INSERT INTO goalscorers (date, homeTeam, awayTeam, scorer, minute, ownGoal, penalty)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    requiredFields: ['date', 'home_team', 'away_team', 'scorer'],
    optionalFields: ['minute', 'own_goal', 'penalty'],
    recordTransformer: (record: any, _lineNumber: number): any[] | null => {
      const minuteValue = record.minute && record.minute.trim() ? parseInt(record.minute, 10) : null;

      return [
        record.date,
        record.home_team,
        record.away_team,
        record.scorer,
        minuteValue,
        record.own_goal === 'TRUE' ? 1 : 0,
        record.penalty === 'TRUE' ? 1 : 0,
      ];
    },
    errorMessages: {
      missingFields: (lineNumber: number, fields: string[], record: any) =>
        `❌ MISSING FIELD(S) in goalscorers.csv at line ${lineNumber}: [${fields.join(', ')}] - Record: ${JSON.stringify(record)}`,
      transformError: (lineNumber: number, error: any, _record: any) =>
        `❌ TRANSFORM ERROR in goalscorers.csv at line ${lineNumber}: ${error.message}`,
      insertError: (lineNumber: number, _error: any, record: any) =>
        `❌ DATABASE ERROR in goalscorers.csv at line ${lineNumber}: Foreign key constraint failed\n   Date: ${record.date}, Home: ${record.home_team}, Away: ${record.away_team}, Scorer: ${record.scorer}\n   The result record (${record.date} ${record.home_team} vs ${record.away_team}) may not exist in results table`,
    },
  };

  return loadDataIntoStaging(db, context);
}

/**
 * Load shootouts from CSV file
 */
export async function loadShootouts(db: FootballDatabase, filePath: string): Promise<number> {
  const context: LoaderContext = {
    fileName: 'shootouts.csv',
    filePath,
    sqlStatement: `INSERT INTO shootouts (date, homeTeam, awayTeam, winner)
                    VALUES (?, ?, ?, ?)`,
    requiredFields: ['date', 'home_team', 'away_team', 'winner'],
    recordTransformer: (record: any, _lineNumber: number): any[] | null => {
      return [record.date, record.home_team, record.away_team, record.winner];
    },
    errorMessages: {
      missingFields: (lineNumber: number, fields: string[], record: any) =>
        `❌ MISSING FIELD(S) in shootouts.csv at line ${lineNumber}: [${fields.join(', ')}] - Record: ${JSON.stringify(record)}`,
      transformError: (lineNumber: number, error: any, _record: any) =>
        `❌ TRANSFORM ERROR in shootouts.csv at line ${lineNumber}: ${error.message}`,
      insertError: (lineNumber: number, _error: any, record: any) =>
        `❌ DATABASE ERROR in shootouts.csv at line ${lineNumber}: Foreign key constraint failed\n   Date: ${record.date}, Home: ${record.home_team}, Away: ${record.away_team}\n   The result record (${record.date} ${record.home_team} vs ${record.away_team}) may not exist in results table`,
    },
  };

  return loadDataIntoStaging(db, context);
}

/**
 * Load former team names from CSV file
 */
export async function loadFormerNames(db: FootballDatabase, filePath: string): Promise<number> {
  const context: LoaderContext = {
    fileName: 'former_names.csv',
    filePath,
    sqlStatement: `INSERT INTO formerNames (currentName, formerName, startDate, endDate)
                    VALUES (?, ?, ?, ?)`,
    requiredFields: ['current', 'former', 'start_date', 'end_date'],
    recordTransformer: (record: any, _lineNumber: number): any[] | null => {
      return [
        record.current.trim(),
        record.former.trim(),
        record.start_date,
        record.end_date,
      ];
    },
    errorMessages: {
      missingFields: (lineNumber: number, fields: string[], record: any) =>
        `❌ MISSING FIELD(S) in former_names.csv at line ${lineNumber}: [${fields.join(', ')}] - Record: ${JSON.stringify(record)}`,
      transformError: (lineNumber: number, error: any, _record: any) =>
        `❌ TRANSFORM ERROR in former_names.csv at line ${lineNumber}: ${error.message}`,
      insertError: (lineNumber: number, _error: any, record: any) =>
        `❌ DATABASE ERROR in former_names.csv at line ${lineNumber}: Failed to insert\n   Name: ${record.current}, Former Name: ${record.former || 'NULL'}`,
    },
  };

  return loadDataIntoStaging(db, context);
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
