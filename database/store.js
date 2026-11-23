const fs = require("fs/promises");
const path = require("path");

const dataFile = path.join(__dirname, "requests.json");

async function readRequests() {
  try {
    const contents = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(contents || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeRequests(requests) {
  const temporaryFile = dataFile + ".tmp";
  await fs.writeFile(temporaryFile, JSON.stringify(requests, null, 2), "utf8");
  await fs.rename(temporaryFile, dataFile);
}

module.exports = { readRequests, writeRequests };
