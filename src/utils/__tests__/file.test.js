import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { createDownloadFolder, getFileName } from '../file.js';
import { app } from '../../config/index.js';
import { getRepoRoot } from '../repo.js';

describe('file.js utilities', () => {
  describe('createDownloadFolder', () => {
    it('should create folder structure correctly', () => {
      const testFolderName = 'test-folder';
      const expectedPath = path.join(getRepoRoot(), app.FOLDERS.DOWNLOADS, testFolderName);

      // Clean up if test folder exists from previous runs
      if (fs.existsSync(expectedPath)) {
        fs.rmdirSync(expectedPath);
      }

      createDownloadFolder(testFolderName);

      // Verify folder was created
      assert.ok(fs.existsSync(expectedPath), 'Folder should be created');
      assert.ok(fs.statSync(expectedPath).isDirectory(), 'Created path should be a directory');

      // Clean up
      fs.rmdirSync(expectedPath);
    });
  });

  describe('getFileName', () => {
    it('should extract filename from path with extension', () => {
      const filePath = '/path/to/file.txt';
      assert.strictEqual(getFileName(filePath), 'file.txt');
    });

    it('should extract filename from path without extension', () => {
      const filePath = '/path/to/file';
      assert.strictEqual(getFileName(filePath), 'file');
    });

    it('should handle simple filename with extension', () => {
      const filePath = 'file.txt';
      assert.strictEqual(getFileName(filePath), 'file.txt');
    });

    it('should handle simple filename without extension', () => {
      const filePath = 'file';
      assert.strictEqual(getFileName(filePath), 'file');
    });
  });
});
