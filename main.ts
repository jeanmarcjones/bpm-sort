import { type Args, parseArgs } from "@std/cli/parse-args";
import {
  copyAudioFiles,
  countFiles,
  findAudioFiles,
  findMissingTags,
} from "./utils/misc.ts";
import {
  printComplete,
  printDryRun,
  printFileTotals,
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
// TODO allow user to define BPM ranges
// TODO improve handling of wav files

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

      const fromTotals = await countFiles(from);
      printFileTotals(fromTotals);

      const spinner = new Spinner({ message: "Copying...", color: "yellow" });
      spinner.start();

      const metadata = await findAudioFiles(from);
      const { missingBPM, missingArtist } = findMissingTags(metadata);

      if (!dryRun) {
        await copyAudioFiles(metadata, to);
      }

      const copiedFiles = metadata.filter((m) => m.tags.BPM && m.tags.artist);
      const toTotals = await countFiles(to);

      spinner.stop();

      // TODO handle all files have missing BPM or artist tags

      printMissingBPM(missingBPM);
      printMissingArtist(missingArtist);

      dryRun ? printDryRun(copiedFiles, to) : printComplete(toTotals);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(red(`[${e.name}]`), red(e.message));
      }

      Deno.exit(1);
    }
  }
}

main(Deno.args);
