import { initializeDatabase } from './src/database/database';
import { loadAllData } from './src/database/csv-loader';

async function testDataLoading() {
  const db = await initializeDatabase();
  
  console.log('Database initialized. Loading CSV data...');
  
  try {
    await loadAllData(db, '/data');
    
    const snapshot = await db.getSnapshot();
    console.log('\n✓ Data loaded successfully!');
    console.log(`Results: ${snapshot.resultsCount}`);
    console.log(`Goalscorers: ${snapshot.goalscorersCount}`);
    console.log(`Shootouts: ${snapshot.shootoutsCount}`);
    console.log(`Former names: ${snapshot.formerNamesCount}`);
  } catch (err) {
    console.error('Error loading data:', err);
  } finally {
    await db.close();
    process.exit(0);
  }
}

testDataLoading();
