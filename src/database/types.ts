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
  name: string;
  formerName: string;
}

export interface DatabaseSnapshot {
  resultsCount: number;
  goalscorersCount: number;
  shootoutsCount: number;
  formerNamesCount: number;
  lastUpdated: string;
}
