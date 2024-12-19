#!/usr/bin/env node

// DISCLAIMER: this script is made by Ougrid D.
// Refactored to preserve Markdown formatting in the results.

import fs from "fs/promises";
import path from "path";
import natural from "natural";

// Initialize the tokenizer
const tokenizer = new natural.WordTokenizer();

const tokenize = (text) => {
  return tokenizer.tokenize(text); // Tokenize the text into an array of words
};

const createChunksWithOverlap = (text, chunkSize = 750, overlap = 150) => {
  const tokens = tokenize(text);

  // Preserve the original text while slicing tokens
  const chunks = [];
  let currentStart = 0;

  while (currentStart < tokens.length) {
    const chunkEnd = Math.min(currentStart + chunkSize, tokens.length);
    const chunkTokens = tokens.slice(currentStart, chunkEnd);

    // Map tokens back to their original substrings
    const chunk = text.substring(
      text.indexOf(chunkTokens[0], currentStart),
      text.indexOf(chunkTokens[chunkTokens.length - 1], currentStart) +
        chunkTokens[chunkTokens.length - 1].length
    );

    if (chunk.length < 50) break; // Skip very small final chunks
    chunks.push(chunk);

    currentStart += chunkSize - overlap;
  }

  return chunks;
};

const processKnowledgeFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const knowledge = JSON.parse(data);

    const fullText = knowledge.chunks.join("\n");
    const newChunks = createChunksWithOverlap(fullText);

    knowledge.chunks = newChunks;

    const outputFilePath = path.join(
      path.dirname(filePath),
      "knowledge-edited.json"
    );

    await fs.writeFile(
      outputFilePath,
      JSON.stringify(knowledge, null, 2),
      "utf-8"
    );
    console.log(`Created ${outputFilePath} with new overlapping chunks.`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error(
      "Usage: node <script relative path> <knowledge.json relative path>"
    );
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  try {
    await fs.access(filePath);
  } catch (error) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  await processKnowledgeFile(filePath);
};

main();
