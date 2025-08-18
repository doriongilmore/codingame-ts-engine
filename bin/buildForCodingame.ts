#!/usr/bin/env node
import { readFileSync, writeFileSync,  } from 'fs';
import { resolve, sep } from 'path';
import argv from "process.argv";

interface Config {
    script: string;
    out: string;
}

const defaultFilename = 'playerScript.ts';

function parseArgs(): Config {
    const processArgv = argv(process.argv.slice(2));
    return processArgv<Config>({
        script: resolve("src", defaultFilename),
        out: resolve("codingame"),
    });
}

function getModifiedContent(rawContent: string): string {
  const [enginePart, playerPart] = rawContent.split("\n// everything until this line must be removed in CodinGame\n")
  
  return playerPart.replace("// main(readline);", "main(readline);");
}

function processFile(config: Config) {
  const filepath = resolve(config.script);
  console.log("reading", filepath)
  const rawContent = readFileSync(filepath, 'utf8');
  const modifiedContent = getModifiedContent(rawContent);
  
  const filename = config.script.split(sep).pop() || defaultFilename;
  const outputFile = resolve(config.out, filename)
  console.log("writing", outputFile)
  writeFileSync(outputFile, modifiedContent);
}

const params = parseArgs();
processFile(params);
