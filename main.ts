import { emptyDirSync, walk } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import {
  analyseDirectoryStructure,
  findAudioFiles,
  makeDirectoryStructure,
} from "./utils.ts";

// TODO explicit return
// TODO import sort

const folders = new Map<string, string[]>();

function parseArguments(args: string[]): Args {
  const stringArgs = [
    "input",
    "output",
  ];

  // TODO alias

  return parseArgs(args, {
    string: stringArgs,
  });
}

async function main(inputArgs: string[]): Promise<void> {
  if (import.meta.main) {
    // TODO handle folders already existing
    emptyDirSync("./out");

    const { input } = parseArguments(inputArgs);

    const fileMetaData = findAudioFiles(input);
    analyseDirectoryStructure(folders, fileMetaData);

    makeDirectoryStructure(folders);

    // TODO decide on approach for moving audio file

    for await (const dirEntry of walk("./out")) {
      console.log("Recursive walking:", dirEntry.name);
    }
  }
}

main(Deno.args);
  