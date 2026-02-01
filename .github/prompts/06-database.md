git fetch
---
agent: agent
---
# Specs

## Requiremetents
1. The Original data for this projects resides in the DATA_PROJECT_ROOT of make files.
1. I want to be able to read the individual files from that direcotry and load them into in memory tables in this project
1. I need a set of tables to store the data (The README.md file there gives a initial descirption of the data) found in the flat files.
1. Please note that the result files contains teams twice in each row, one for home and another for away

## Contraints
1. In memory database must be accessible for the web app
1. I must be able to persist the in memory database
1. Database must be readable when app starts
1. New Data in the flat files can arrive at any time and will arive whole, not deltas, we need to be able to fully load the tables again without losing data in the tables that are NOT in the original loaded data

## Success Criteria and Verifications
1. Ensure the files can be loaded into the tables and both contains the same data, no more, no leass.
1. All inked tables behave properly
1. Database can be written from memory to the disk and replace any existing one
1. Database can br read from the disk and replace the memory content.

## Implementation Plan

### Commit 1: Create database schema and types
- Create `src/database/types.ts` with TypeScript interfaces for all tables:
  - Result (with home/away teams)
  - Goalscorer
  - Shootout
  - FormerName
  - DatabaseSnapshot for verification

### Commit 2: Add database initialization and setup
- Create `src/database/database.ts` with Database class
- Implement table schema creation in SQLite
- Add methods: `initialize()`, `getSnapshot()` 
- Export database instance from `src/database/index.ts`

### Commit 3: Write failing tests for CSV loading
- Create `tests/database.test.ts` with Jest test suites:
  - Test CSV parsing (each file type)
  - Test data integrity (row count verification)
  - Test team duplication handling in results
  - Test linked table consistency (results ↔ goalscorers, results ↔ shootouts)
  - Tests MUST fail at this point

### Commit 4: Implement CSV loader and data loading
- Create `src/database/csv-loader.ts` with:
  - CSV parser (handle headers, data types)
  - `loadResults()`, `loadGoalscorers()`, `loadShootouts()`, `loadFormerNames()` methods
  - Proper type coercion (dates, numbers, booleans)
  - Error handling for malformed rows

### Commit 5: Implement persistence layer
- Add to `src/database/database.ts`:
  - `save(filePath)`: Export database to file
  - `load(filePath)`: Import database from file
  - Atomic writes to prevent corruption
  - Support for replacing/merging individual tables

### Commit 6: Integrate with app startup
- Update `src/index.ts`:
  - Initialize database on startup
  - Load persisted database if exists
  - Load data from `/data` directory if needed
  - Export database instance for app usage

### Commit 7: Run tests and verify all pass
- Execute all database tests
- Verify data integrity matches CSV files exactly
- Verify partial reload doesn't lose data in other tables
- Verify persistence works correctly
- All tests green before merge