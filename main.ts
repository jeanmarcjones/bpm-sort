import { emptyDirSync, walk } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import { brightCyan, brightYellow } from "@std/fmt/colors";
import {
  analyseDirectoryStructure,
  findAudioFiles,
  makeDirectoryStructure,
} from "./utils.ts";

// TODO add --help argument

function parseArguments(args: string[]): Args {
  // TODO re-name?
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
    const { folders, missingBPM, missingArtist } = analyseDirectoryStructure(
      fileMetaData,
    );

    makeDirectoryStructure(folders, output);

    // TODO decide on approach for moving audio file

    console.log();

    if (missingBPM.length > 0) {
      console.log(brightYellow("Files missing a BPM tag:"));
      for (const path of missingBPM) {
        console.log(path);
      }
      console.log();
    }

    if (missingArtist.length > 0) {
      console.log(brightCyan("Files missing a Artist tag:"));
      for (const path of missingArtist) {
        console.log(path);
      }
      console.log();
    }

    // TODO log stats on folders created and files moved

    for await (const dirEntry of walk(output)) {
      console.log("Recursive walking:", dirEntry.name);
    }
  }
}

main(Deno.args);
