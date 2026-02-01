/**
 * Database schema types for international football data
 */

export interface Result {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  tournament: string;
  city: string;
  country: string;
  neutral: number;
}

export interface Goalscorer {
  date: string;
  homeTeam: string;
  awayTeam: string;
  scorer: string;
  minute: number | null;
  ownGoal: number;
  penalty: number;
}

export interface Shootout {
  date: string;
  homeTeam: string;
  awayTeam: string;
  winner: string;
}

export interface FormerName {
  currentName: string;
  formerName: string;
  startDate: string;
  endDate: string;
}

export interface DatabaseSnapshot {
  resultsCount: number;
  goalscorersCount: number;
  shootoutsCount: number;
  formerNamesCount: number;
  lastUpdated: string;
}
/**
 * Context object for unified data loading into staging tables
 */
export interface LoaderContext {
  /**
   * Name of the CSV file for error messages (e.g., "results.csv")
   */
  fileName: string;

  /**
   * Path to the CSV file to load
   */
  filePath: string;

  /**
   * SQL INSERT statement with placeholders for parameters
   */
  sqlStatement: string;

  /**
   * List of required fields that must be present in every record
   */
  requiredFields: string[];

  /**
   * List of optional fields (can be undefined, null, or empty)
   */
  optionalFields?: string[];

  /**
   * Function to transform raw CSV record into database-ready values
   * Returns the array of values to be inserted, or null if record should be skipped
   */
  recordTransformer: (record: any, lineNumber: number) => any[] | null;

  /**
   * Custom error messages for specific error conditions
   */
  errorMessages: {
    missingFields: (lineNumber: number, fields: string[], record: any) => string;
    transformError: (lineNumber: number, error: any, record: any) => string;
    insertError: (lineNumber: number, error: any, record: any) => string;
  };
}