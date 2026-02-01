import { FootballDatabase } from '../src/database/database';
import { Result, Goalscorer, Shootout, FormerName } from '../src/database/types';

describe('Database', () => {
  let db: FootballDatabase;

  beforeEach(async () => {
    db = new FootballDatabase();
    await db.ready();
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('Initialization', () => {
    it('should create all tables on initialize', async () => {
      const rows = await db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const tableNames = rows.map((r) => r.name).sort();
      expect(tableNames).toContain('results');
      expect(tableNames).toContain('goalscorers');
      expect(tableNames).toContain('shootouts');
      expect(tableNames).toContain('formerNames');
    });

    it('should have empty snapshot on initialization', async () => {
      const snapshot = await db.getSnapshot();
      expect(snapshot.resultsCount).toBe(0);
      expect(snapshot.goalscorersCount).toBe(0);
      expect(snapshot.shootoutsCount).toBe(0);
      expect(snapshot.formerNamesCount).toBe(0);
    });
  });

  describe('Data Loading', () => {
    it('should load results from CSV and maintain data integrity', async () => {
      const testResult: Result = {
        date: '1872-03-30',
        homeTeam: 'Scotland',
        awayTeam: 'England',
        homeGoals: 0,
        awayGoals: 0,
        tournament: 'Friendly',
        city: 'Glasgow',
        country: 'Scotland',
        neutral: 0,
      };

      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testResult.date,
          testResult.homeTeam,
          testResult.awayTeam,
          testResult.homeGoals,
          testResult.awayGoals,
          testResult.tournament,
          testResult.city,
          testResult.country,
          testResult.neutral,
        ]
      );

      const snapshot = await db.getSnapshot();
      expect(snapshot.resultsCount).toBe(1);

      const retrieved = await db.get(
        'SELECT * FROM results WHERE date = ? AND homeTeam = ? AND awayTeam = ?',
        [testResult.date, testResult.homeTeam, testResult.awayTeam]
      );

      expect(retrieved).toEqual(testResult);
    });

    it('should load goalscorers with foreign key relationships', async () => {
      // Insert a result first
      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['1872-03-30', 'Scotland', 'England', 2, 1, 'Friendly', 'Glasgow', 'Scotland', 0]
      );

      // Insert a goalscorer
      const goalscorer: Goalscorer = {
        date: '1872-03-30',
        homeTeam: 'Scotland',
        awayTeam: 'England',
        scorer: 'Alexander Rhind',
        minute: 23,
        ownGoal: 0,
        penalty: 0,
      };

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

      const snapshot = await db.getSnapshot();
      expect(snapshot.goalscorersCount).toBe(1);

      const retrieved = await db.get(
        'SELECT * FROM goalscorers WHERE date = ? AND homeTeam = ? AND awayTeam = ? AND scorer = ?',
        [goalscorer.date, goalscorer.homeTeam, goalscorer.awayTeam, goalscorer.scorer]
      );

      expect(retrieved.minute).toBe(23);
      expect(retrieved.penalty).toBe(0);
    });

    it('should load goalscorers with missing minute values', async () => {
      // Insert a result first
      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['1980-09-18', 'China', 'North Korea', 1, 0, 'Friendly', 'Beijing', 'China', 0]
      );

      // Insert a goalscorer with null minute (historical data where minute not recorded)
      const goalscorer: Goalscorer = {
        date: '1980-09-18',
        homeTeam: 'China',
        awayTeam: 'North Korea',
        scorer: 'Hwang Sang-hoi',
        minute: null,
        ownGoal: 0,
        penalty: 0,
      };

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

      const snapshot = await db.getSnapshot();
      expect(snapshot.goalscorersCount).toBe(1);

      const retrieved = await db.get(
        'SELECT * FROM goalscorers WHERE date = ? AND homeTeam = ? AND awayTeam = ? AND scorer = ?',
        [goalscorer.date, goalscorer.homeTeam, goalscorer.awayTeam, goalscorer.scorer]
      );

      expect(retrieved.minute).toBeNull();
      expect(retrieved.penalty).toBe(0);
    });

    it('should load shootouts with foreign key relationships', async () => {
      // Insert a result first
      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['2012-06-28', 'Spain', 'Portugal', 0, 0, 'Euro 2012', 'Kyiv', 'Ukraine', 0]
      );

      // Insert shootout
      const shootout: Shootout = {
        date: '2012-06-28',
        homeTeam: 'Spain',
        awayTeam: 'Portugal',
        winner: 'Spain',
      };

      await db.run(
        `INSERT INTO shootouts (date, homeTeam, awayTeam, winner)
         VALUES (?, ?, ?, ?)`,
        [shootout.date, shootout.homeTeam, shootout.awayTeam, shootout.winner]
      );

      const snapshot = await db.getSnapshot();
      expect(snapshot.shootoutsCount).toBe(1);

      const retrieved = await db.get(
        'SELECT * FROM shootouts WHERE date = ? AND homeTeam = ? AND awayTeam = ?',
        [shootout.date, shootout.homeTeam, shootout.awayTeam]
      );

      expect(retrieved.winner).toBe('Spain');
    });

    it('should load former names', async () => {
      const formerName: FormerName = {
        currentName: 'Ivory Coast',
        formerName: "Côte d'Ivoire",
        startDate: '1960-01-01',
        endDate: '1986-01-01',
      };

      await db.run('INSERT INTO formerNames (currentName, formerName, startDate, endDate) VALUES (?, ?, ?, ?)', [
        formerName.currentName,
        formerName.formerName,
        formerName.startDate,
        formerName.endDate,
      ]);

      const snapshot = await db.getSnapshot();
      expect(snapshot.formerNamesCount).toBe(1);

      const retrieved = await db.get('SELECT * FROM formerNames WHERE currentName = ?', [
        formerName.currentName,
      ]);

      expect(retrieved.formerName).toBe("Côte d'Ivoire");
    });

    it('should load former names with all fields populated', async () => {
      const formerName: FormerName = {
        currentName: 'Myanmar',
        formerName: 'Burma',
        startDate: '1948-01-04',
        endDate: '1989-06-18',
      };

      await db.run('INSERT INTO formerNames (currentName, formerName, startDate, endDate) VALUES (?, ?, ?, ?)', [
        formerName.currentName,
        formerName.formerName,
        formerName.startDate,
        formerName.endDate,
      ]);

      const snapshot = await db.getSnapshot();
      expect(snapshot.formerNamesCount).toBe(1);

      const retrieved = await db.get('SELECT * FROM formerNames WHERE currentName = ?', [
        formerName.currentName,
      ]);

      expect(retrieved.formerName).toBe('Burma');
    });
  });

  describe('Data Integrity', () => {
    it('should enforce foreign key constraint on goalscorers', async () => {
      // Try to insert a goalscorer without a corresponding result
      try {
        await db.run(
          `INSERT INTO goalscorers (date, homeTeam, awayTeam, scorer, minute, ownGoal, penalty)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['1999-12-31', 'Team A', 'Team B', 'Player', 45, 0, 0]
        );
        fail('Expected foreign key constraint error');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should enforce foreign key constraint on shootouts', async () => {
      // Try to insert a shootout without a corresponding result
      try {
        await db.run(
          `INSERT INTO shootouts (date, homeTeam, awayTeam, winner)
           VALUES (?, ?, ?, ?)`,
          ['1999-12-31', 'Team A', 'Team B', 'Team A']
        );
        fail('Expected foreign key constraint error');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should clear all data when clear() is called', async () => {
      // Insert test data
      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['1872-03-30', 'Scotland', 'England', 0, 0, 'Friendly', 'Glasgow', 'Scotland', 0]
      );

      await db.run('INSERT INTO formerNames (currentName, formerName, startDate, endDate) VALUES (?, ?, ?, ?)', [
        'Brazil',
        'United States of Brazil',
        '1822-09-07',
        '1889-11-15',
      ]);

      let snapshot = await db.getSnapshot();
      expect(snapshot.resultsCount).toBe(1);
      expect(snapshot.formerNamesCount).toBe(1);

      // Clear database
      await db.clear();

      snapshot = await db.getSnapshot();
      expect(snapshot.resultsCount).toBe(0);
      expect(snapshot.formerNamesCount).toBe(0);
    });
  });

  describe('Partial Updates', () => {
    it('should allow clearing one table without losing data in other tables', async () => {
      // Insert data in multiple tables
      await db.run(
        `INSERT INTO results (date, homeTeam, awayTeam, homeGoals, awayGoals, tournament, city, country, neutral)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['1872-03-30', 'Scotland', 'England', 0, 0, 'Friendly', 'Glasgow', 'Scotland', 0]
      );

      await db.run('INSERT INTO formerNames (currentName, formerName, startDate, endDate) VALUES (?, ?, ?, ?)', [
        'Brazil',
        'United States of Brazil',
        '1822-09-07',
        '1889-11-15',
      ]);

      let snapshot = await db.getSnapshot();
      expect(snapshot.resultsCount).toBe(1);
      expect(snapshot.formerNamesCount).toBe(1);

      // Clear only results table
      await db.run('DELETE FROM goalscorers');
      await db.run('DELETE FROM shootouts');
      await db.run('DELETE FROM results');

      snapshot = await db.getSnapshot();
      expect(snapshot.resultsCount).toBe(0);
      expect(snapshot.formerNamesCount).toBe(1); // Should still have former names
    });
  });
});
