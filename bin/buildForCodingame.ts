#!/usr/bin/env node
import { readFileSync, writeFileSync,  } from 'fs';
import { resolve, sep } from 'path';
import argv from "process.argv";

interface Config {
    script: string;
    out: string;
}

const defaultFilename = 'playerScript.ts';

const knownEngineLines = [
  "const API: PuzzleScript = { main };",
  "export default API;",
  "// everything until this line must be removed in CodinGame",
];

const toBeRemoved = "/**\n"+
" * Auto-generated code below aims at helping you use\n"+
" * codingame-ts-engine. You can see the Auto-generated code\n"+
" * from codingame in `main` function.\n"+
" *\n"+
" * The beginning of this file until `export default API;` (included)\n"+
" * must be removed before copy-pasting to CodinGame\n"+
" * You should also remember to uncomment the last line `main(readline);`\n"+
" **/\n";
const alreadyImported: Set<string> = new Set<string>();

function parseArgs(): Config {
    const processArgv = argv(process.argv.slice(2));
    return processArgv<Config>({
        script: resolve("src", defaultFilename),
        out: resolve("codingame"),
    });
}

function isRelevantImportLine(line: string): boolean {
  return line.startsWith("import") && !line.includes("@doriongilmore/codingame-ts-engine")
}

function isRelevantScriptLine(line: string): boolean {
  return !line.startsWith("import") && !knownEngineLines.includes(line);
}

function parseScriptLine(line: string): string {
  return line.startsWith("export") ? line.replace(/export (default )?/i, "") : line
}

function getImportFilepaths(importLines: string[]): string[] {
  const filepaths:string[] = [];
  const regex = /import ([a-z\{\} ]*) from \"([a-z\.\/]*)"\;?/i

  for (const line of importLines) {
    const exec = regex.exec(line);
    if (exec) {
      const [_imports, path] = exec.slice(1);
      if (path?.startsWith("./")) {
        filepaths.push(path);
      } else {
        console.warn("only relative paths are supported, error with import", path);
      }
    } else {
      console.warn("import wrongly detected", line);
    }
  }

  return filepaths;
}

function parseFile(config: Config, filepath: string): string {
  const completeContent: string[] = [];

  const filename = filepath.endsWith(".ts") ? filepath : `${filepath}.ts`;
  const completeFilepath = resolve(config.script, "..", filename);
  const fileContent = readFileSync(completeFilepath, "utf-8").split("\n");
  const importLines = getImportFilepaths(fileContent.filter(isRelevantImportLine));
  const otherLines = fileContent.filter(isRelevantScriptLine).map(parseScriptLine);

  for (const importFilepath of importLines) {
    if (!alreadyImported.has(importFilepath)) {
      alreadyImported.add(importFilepath);
      completeContent.push(parseFile(config, importFilepath));
    }
  }

  completeContent.push(`// file:${completeFilepath}`);
  completeContent.push(otherLines.join("\n"));

  return completeContent.join("\n");
}

function processFile(config: Config) {
  const filepath = resolve(config.script);

  console.log("reading", filepath)
  const modifiedContent = parseFile(config, filepath).replace("// main(readline);", "main(readline);").replace(toBeRemoved, "");
  
  const filename = config.script.split(sep).pop() || defaultFilename;
  const outputFile = resolve(config.out, filename)

  console.log("writing", outputFile)
  writeFileSync(outputFile, modifiedContent);
}

const params = parseArgs();
processFile(params);
