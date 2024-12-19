#!/usr/bin/env node

// DISCLAIMER: this script is made by Ougrid D.
// to concatenate the chunks of a knowledge file extarcted with the folder2knowledge script into overlapping chunks for better retrieval in RAG

import fs from "fs/promises";
import path from "path";

const tokenize = (text) => {
  // return text.match(/[^\s]+|[^#+\s.]+/g) || [];
  return (
    text.match(
      /(^#+\s.+$)|((\s*[-*]\s.+\n?)+)|(^```[^]+```)|(\[.+\]\(.+\))|(!\[.+\]\(.+\))|(\*\*.+\*\*)|(\*.+\*)|(~~.+~~)|(`.+`)|(^>.+)|(^---+)|((\|.+)+\|)|(\[\^.+\]:.+|[^\s]+)/gm
    ) || []
  );

  // regex that matches MD headers: /^#+\s.+/gm
  // details: ^ - start of line, #+ - one or more #, \s - whitespace, .+ - one or more of any character
  // regex that matches MD lists: /^(\s*[-*]\s.+\n?)+/gm
  // details: ^ - start of line, \s* - zero or more whitespace, [-*] - - or *, \s - whitespace, .+ - one or more of any character, \n? - zero or one newline
  // regex that matches MD code blocks: /^```[^]+```/gm
  // details: ^ - start of line, ``` - start of code block, [^]+ - one or more of any character, ``` - end of code block
  // regex that matches MD links: /\[.+\]\(.+\)/g
  // details: \[ - opening square bracket, .+ - one or more of any character, \] - closing square bracket, \( - opening parenthesis, .+ - one or more of any character, \) - closing parenthesis
  // regex that matches MD images: /!\[.+\]\(.+\)/g
  // details: !\[ - opening square bracket with exclamation mark, .+ - one or more of any character, \] - closing square bracket, \( - opening parenthesis, .+ - one or more of any character, \) - closing parenthesis
  // regex that matches MD bold: /\*\*.+\*\*/g
  // details: \*\* - two asterisks, .+ - one or more of any character, \*\* - two asterisks
  // regex that matches MD italic: /\*.+\*/g
  // details: \* - one asterisk, .+ - one or more of any character, \* - one asterisk
  // regex that matches MD strikethrough: /~~.+~~/g
  // details: ~~ - two tildes, .+ - one or more of any character, ~~ - two tildes
  // regex that matches MD inline code: /`.+`/g
  // details: ` - backtick, .+ - one or more of any character, ` - backtick
  // regex that matches MD blockquote: /^>.+/gm
  // details: ^ - start of line, > - greater than sign, .+ - one or more of any character
  // regex that matches MD horizontal rule: /^---+/gm
  // details: ^ - start of line, ---+ - three or more dashes
  // regex that matches MD tables: /(\|.+)+\|/g
  // details: \| - pipe, .+ - one or more of any character, \| - pipe
  // regex that matches MD footnotes: /\[\^.+\]:.+/g
  // details: \[ - opening square bracket, \^ - caret, .+ - one or more of any character, \] - closing square bracket, : - colon, .+ - one or more of any character
  // regex that matches MD links and images: /(\[.+\]\(.+\))|(!\[.+\]\(.+\))/g
  // details: (\[.+\]\(.+\)) - link, | - or, (!\[.+\]\(.+\)) - image
  // regex that matches MD bold and italic: /(\*\*.+\*\*)|(\*.+\*)/g
  // details: (\*\*.+\*\*) - bold, | - or, (\*.+\*) - italic
  // regex that matches MD bold, italic, and strikethrough: /(\*\*.+\*\*)|(\*.+\*)|(~~.+~~)/g
  // details: (\*\*.+\*\*) - bold, | - or, (\*.+\*) - italic, | - or, (~~.+~~) - strikethrough
  // regex that matches MD inline code and blockquote: /(`.+`)|(^>.+)/g
  // details: (`.+`) - inline code, | - or, (^>.+) - block
  // regex that matches MD tables and footnotes: /((\|.+)+\|)|(\[\^.+\]:.+)/g
  // details: ((\|.+)+\|) - table, | - or, (\[\^.+\]:.+) - footnote
  // regex that matches MD elements: /(^#+\s.+$)|((\s*[-*]\s.+\n?)+)|(^```[^]+```)|(\[.+\]\(.+\))|(!\[.+\]\(.+\))|(\*\*.+\*\*)|(\*.+\*)|(~~.+~~)|(`.+`)|(^>.+)|(^---+)|((\|.+)+\|)|(\[\^.+\]:.+)/gm
};

const createChunksWithOverlap = (text, chunkSize = 750, overlap = 150) => {
  const tokens = tokenize(text);
  console.log({ tokens });

  const chunks = [];
  for (let i = 0; i < tokens.length; i += chunkSize - overlap) {
    const chunk = tokens.slice(i, i + chunkSize);
    if (chunk.length < 50) break; // Skip very small final chunks
    chunks.push(chunk.join(" ")); // Preserve formatting explicitly
    // chunks.push(chunk.join("")); // Concatenate without additional spaces
    // console.log({ chunk });
  }
  return chunks;
};

const processKnowledgeFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const knowledge = JSON.parse(data);

    const fullText = knowledge.chunks.join("\n");
    // console.log({ fullText });
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
    // e.g. node scripts/knowledge-editing-method-01.js knowledge.json
    // (assume that you are in root dir)
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
