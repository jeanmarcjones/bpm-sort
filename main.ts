import { emptyDirSync } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import { brightCyan, brightYellow, green } from "@std/fmt/colors";
import {
  analyseDirectoryStructure,
  copyAudioFiles,
  findAudioFiles,
  makeDirectoryStructure,
} from "./utils.ts";

// TODO add --help argument

function parseArguments(args: string[]): Args {
  const stringArgs = [
    "from",
    "to",
  ];

  const alias = {
    "from": "f",
    "to": "t",
  };

  return parseArgs(args, {
    alias,
    string: stringArgs,
    // TODO decide on default location
    default: { to: "./out" },
  });
}

function main(inputArgs: string[]): void {
  if (import.meta.main) {
    const { from, to } = parseArguments(inputArgs);

    // TODO handle folders already existing
    emptyDirSync(to);

    const metadata = findAudioFiles(from);
    const {
      folders,
      missingBPM,
      missingArtist,
    } = analyseDirectoryStructure(metadata);

    makeDirectoryStructure(folders, to);
    copyAudioFiles(metadata, to);

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

    // TODO log stats on created folders?
    const copiedFiles = metadata.filter((m) =>
      !m.tags.BPM || !m.tags.artist
    ).length;
    console.log(green(`Complete copied ${copiedFiles} files.`));
  }
}

main(Deno.args);
