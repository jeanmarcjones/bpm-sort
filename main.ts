import { emptyDirSync, walk } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import {
  analyseDirectoryStructure,
  findAudioFiles,
  makeDirectoryStructure,
} from "./utils.ts";

// TODO set explicit return types
// TODO sort import

const folders = new Map<string, string[]>();

function parseArguments(args: string[]): Args {
  const stringArgs = [
    "input",
    "output",
  ];

  return parseArgs(args, {
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
