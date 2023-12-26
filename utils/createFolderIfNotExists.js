// createFolder.js
const fs = require("fs/promises");

async function createFolderIfNotExists(folderPath) {
  try {
    await fs.access(folderPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(folderPath, { recursive: true });
    } else {
      throw error;
    }
  }
  return folderPath;
}

module.exports = { createFolderIfNotExists };
