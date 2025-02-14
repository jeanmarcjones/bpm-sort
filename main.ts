import { emptyDirSync } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import {
  copyAudioFiles,
  countDirectories,
  findAudioFiles,
  findMissingTags,
} from "./utils/misc.ts";
import {
  printComplete,
  printDryRun,
  printMissingArtist,
  printMissingBPM,
} from "./utils/logging.ts";
import { validateToAndFromDirectories } from "./utils/errors.ts";

// TODO add --help argument
// TODO allow multiple from folders
// TODO toggle mp3 behavior
// TODO toggle collect missing behavior
// TODO change colab character

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

    validateToAndFromDirectories(from, to);

    // TODO handle folders already existing
    emptyDirSync(to);

    const metadata = findAudioFiles(from);
    const { missingBPM, missingArtist } = findMissingTags(metadata);

    if (!dryRun) {
      copyAudioFiles(metadata, to);
    }

    // TODO handle all files have missing BPM or arist tags

    console.log();

    printMissingBPM(missingBPM);

    printMissingArtist(missingArtist);

    const copiedFiles = metadata.filter((m) => m.tags.BPM && m.tags.artist);
    const totalCopiedFiles = copiedFiles.length;
    const foldersCreated = dryRun ? 0 : countDirectories(to);

    dryRun
      ? printDryRun(copiedFiles, to)
      : printComplete(totalCopiedFiles, foldersCreated);
  }
}

main(Deno.args);
