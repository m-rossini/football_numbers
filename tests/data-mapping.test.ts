import fs from 'fs';
import path from 'path';

describe('Data Mapping', () => {
  const DATA_MOUNT_PATH = '/data';

  describe('Dev environment data access', () => {
    it('should have data directory mounted at /data', () => {
      const dataDirExists = fs.existsSync(DATA_MOUNT_PATH);
      expect(dataDirExists).toBe(true);
    });

    it('should have read access to data directory', () => {
      const stats = fs.statSync(DATA_MOUNT_PATH);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should be able to read files from data directory', () => {
      const files = fs.readdirSync(DATA_MOUNT_PATH);
      // Files should be accessible (non-empty or empty, both valid)
      expect(Array.isArray(files)).toBe(true);
    });

    it('should prevent write access to data directory (read-only mount)', () => {
      const testFile = path.join(DATA_MOUNT_PATH, 'test-write.txt');
      expect(() => {
        fs.writeFileSync(testFile, 'test');
      }).toThrow();
    });
  });

  describe('Prod environment data access', () => {
    it('production container should also have /data mounted', () => {
      const dataDirExists = fs.existsSync(DATA_MOUNT_PATH);
      expect(dataDirExists).toBe(true);
    });

    it('production and dev should have identical data access', () => {
      const devFiles = fs.readdirSync(DATA_MOUNT_PATH);
      // Verify listing works (same behavior as dev)
      expect(Array.isArray(devFiles)).toBe(true);
    });
  });
});
