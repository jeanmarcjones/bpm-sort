import { emptyDirSync, walk } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import {
  analyseDirectoryStructure,
  findAudioFiles,
  makeDirectoryStructure,
} from "./utils.ts";

// TODO add --help argument

const folders = new Map<string, string[]>();

function parseArguments(args: string[]): Args {
  const stringArgs = [
    "input",
    "output",
  ];

  const alias = {
    "input": "i",
    "output": "o",
  };

  return parseArgs(args, {
    alias,
    string: stringArgs,
    default: { output: "./out" },
  });
}

async function main(inputArgs: string[]): Promise<void> {
  if (import.meta.main) {
    const { input, output } = parseArguments(inputArgs);

    // TODO handle folders already existing
    emptyDirSync(output);

    const fileMetaData = findAudioFiles(input);
    analyseDirectoryStructure(folders, fileMetaData);

    makeDirectoryStructure(folders, output);

    // TODO decide on approach for moving audio file

    for await (const dirEntry of walk(output)) {
      console.log("Recursive walking:", dirEntry.name);
    }
  }
}

main(Deno.args);
