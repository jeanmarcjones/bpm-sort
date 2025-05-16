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

function parseArguments(args: string[]): Args & { sources: string[] } {
  const booleanArgs = ["dry-run"];
  const stringArgs = ["to"];

  const alias = {
    to: "t",
    "dry-run": "d",
  };

  const parsedArgs = parseArgs(args, {
    alias,
    boolean: booleanArgs,
    string: stringArgs,
  });

  const sources = parsedArgs._.map(String);

  if (sources.length === 0) {
    throw new Error("Please provide at least one source directory.");
  }

  validateToAndFromDirectories(sources, parsedArgs.to);

  return { ...parsedArgs, sources };
}

async function main(inputArgs: string[]): Promise<void> {
  if (import.meta.main) {
    try {
      const { sources, to, ["dry-run"]: dryRun } = parseArguments(inputArgs);

      const spinner = new Spinner({
        message: "Processing...",
        color: "yellow",
      });
      spinner.start();

      const combinedMetadata = [];

      for (const source of sources) {
        const fromTotals = await countFiles(source);
        printFileTotals(fromTotals);

        const metadata = await findAudioFiles(source);
        combinedMetadata.push(...metadata);
      }

      const { missingBPM, missingArtist } = findMissingTags(combinedMetadata);

      if (!dryRun) {
        await copyAudioFiles(combinedMetadata, to);
      }

      const copiedFiles = combinedMetadata.filter((m) =>
        m.tags.BPM && m.tags.artist
      );
      const toTotals = await countFiles(to);

      spinner.stop();

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
