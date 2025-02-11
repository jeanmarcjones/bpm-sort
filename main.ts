import { emptyDirSync } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import { brightCyan, brightYellow } from "@std/fmt/colors";
import {
  analyseDirectoryStructure,
  copyAudioFiles,
  findAudioFiles,
  makeDirectoryStructure,
} from "./utils/misc.ts";
import { printComplete, printDryRun } from "./utils/logging.ts";

// TODO add --help argument
// TODO allow multiple from folders
// TODO put mp3 in own directory
// TODO collect files missing bmp or artists tag into separate folder
// TODO handle colab tracks

function parseArguments(args: string[]): Args {
  const booleanArgs = [
    "dry-run",
  ];

  const stringArgs = [
    "from",
    "to",
  ];

  const alias = {
    from: "f",
    to: "t",
    "dry-run": "d",
  };

  return parseArgs(args, {
    alias,
    boolean: booleanArgs,
    string: stringArgs,
    // TODO decide on default location
    default: { to: "./out" },
  });
}

function main(inputArgs: string[]): void {
  if (import.meta.main) {
    const { from, to, ["dry-run"]: dryRun } = parseArguments(inputArgs);

    // TODO handle folders already existing
    emptyDirSync(to);

    const metadata = findAudioFiles(from);
    const {
      folders,
      missingBPM,
      missingArtist,
    } = analyseDirectoryStructure(metadata);

    let foldersCreated = 0;

    if (!dryRun) {
      foldersCreated = makeDirectoryStructure(folders, to);
      copyAudioFiles(metadata, to);
    }

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

    const copiedFiles = metadata.filter((m) => m.tags.BPM && m.tags.artist);
    const totalCopiedFiles = copiedFiles.length;

    dryRun
      ? printDryRun(copiedFiles, to)
      : printComplete(totalCopiedFiles, foldersCreated);
  }
}

main(Deno.args);
