#!/usr/bin/env node
import { readFileSync, writeFileSync,  } from 'fs';
import { resolve, sep } from 'path';
import argv from "process.argv";

interface BuildScriptApi {
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

function parseArgs(): BuildScriptApi {
    const processArgv = argv(process.argv.slice(2));
    return processArgv<BuildScriptApi>({
        script: resolve("src", defaultFilename),
        out: resolve("codingame"),
    });
}

function isImportLine(line: string): boolean {
  return line.startsWith("import"); 
}
function isExportLine(line: string): boolean {
  return line.startsWith("export"); 
}

function isRelevantImportLine(line: string): boolean {
  return isImportLine(line) && !line.includes("@doriongilmore/codingame-ts-engine")
}

function isRelevantScriptLine(line: string): boolean {
  return !isImportLine(line) && !knownEngineLines.includes(line);
}

function cleanScriptLine(line: string): string {
  return isExportLine(line) ? line.replace(/export (default )?/i, "") : line
}

function getImportFilepaths(importLines: string[]): string[] {
  const filepaths:string[] = [];
  const regex = /import ([a-z\{\} ]*) from \"([a-z\.\/]*)"\;?/i

  for (const line of importLines) {
    const exec = regex.exec(line);
    if (!exec) {
      console.warn("import wrongly detected", line);
      continue;
    }
    const [_imports, path] = exec.slice(1);
    if (!path?.startsWith("./")) {
      console.warn("only relative paths are supported, error with import", path);
      continue;
    }
    filepaths.push(path);
  }

  return filepaths;
}

function parseFileRecursively(config: BuildScriptApi, filepath: string): string {
  const filename = filepath.endsWith(".ts") ? filepath : `${filepath}.ts`;
  const completeFilepath = resolve(config.script, "..", filename);
  const fileContent = readFileSync(completeFilepath, "utf-8").split("\n");
  const importLines = fileContent.filter(isRelevantImportLine);
  const scriptLines = fileContent.filter(isRelevantScriptLine).map(cleanScriptLine);
  
  const completeContent: string[] = [];
  const importedFiles = getImportFilepaths(importLines);
  for (const importFilepath of importedFiles) {
    if (!alreadyImported.has(importFilepath)) {
      alreadyImported.add(importFilepath);
      completeContent.push(parseFileRecursively(config, importFilepath));
    }
  }

  completeContent.push(`// file:${completeFilepath}`);
  completeContent.push(scriptLines.join("\n"));

  return completeContent.join("\n");
}

function cleanFinalContent(fileContent: string): string {
  return fileContent
    .replace("// main(readline);", "main(readline);")
    .replace(toBeRemoved, "")
    .replaceAll(/\n{3,}/g, "\n\n"); // two linebreaks make one blank line, more is useless
}

function processFile(config: BuildScriptApi) {
  const filepath = resolve(config.script);

  console.log("reading", filepath)
  const modifiedContent = cleanFinalContent(parseFileRecursively(config, filepath));
  
  const filename = config.script.split(sep).pop() || defaultFilename;
  const outputFile = resolve(config.out, filename)

  console.log("writing", outputFile)
  writeFileSync(outputFile, modifiedContent);
}

const params = parseArgs();
processFile(params);
