import { emptyDir } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";
import {
  copyAudioFiles,
  countAudioFiles,
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
import { red } from "@std/fmt/colors";
import { Spinner } from "@std/cli/unstable-spinner";

// TODO add --help argument
// TODO allow multiple from folders
// TODO toggle mp3 behavior
// TODO toggle collect missing behavior
// TODO change colab character
// TODO switch to progress bars

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

  const parsedArgs = parseArgs(args, {
    alias,
    boolean: booleanArgs,
    string: stringArgs,
  });

  validateToAndFromDirectories(parsedArgs.from, parsedArgs.to);

  return parsedArgs;
}

async function main(inputArgs: string[]): Promise<void> {
  if (import.meta.main) {
    try {
      const { from, to, ["dry-run"]: dryRun } = parseArguments(inputArgs);

      const total = await countAudioFiles(from);
      console.log("Found", total, "audio files.");

      const spinner = new Spinner({ message: "Copying...", color: "yellow" });
      spinner.start();

      // TODO handle folders already existing
      await emptyDir(to);

      const metadata = await findAudioFiles(from);
      const { missingBPM, missingArtist } = findMissingTags(metadata);

      if (!dryRun) {
        await copyAudioFiles(metadata, to);
      }

      spinner.stop();

      // TODO handle all files have missing BPM or artist tags

      printMissingBPM(missingBPM);
      printMissingArtist(missingArtist);

      const copiedFiles = metadata.filter((m) => m.tags.BPM && m.tags.artist);
      const totalCopiedFiles = copiedFiles.length;
      const foldersCreated = dryRun ? 0 : await countDirectories(to);

      // TODO fix incorrect totals
      dryRun
        ? printDryRun(copiedFiles, to)
        : printComplete(totalCopiedFiles, foldersCreated);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(red(`[${e.name}]`), red(e.message));
      }

      Deno.exit(1);
    }
  }
}

main(Deno.args);
