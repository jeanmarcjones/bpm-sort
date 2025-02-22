import { brightCyan, brightYellow, green, magenta, red } from "@std/fmt/colors";
import { type Metadata } from "../schemas/metadata.ts";
import { createToPath, Totals } from "./misc.ts";

// TODO snapshot tests?

function printComplete(totals: Totals): void {
  console.log(green(`Complete...`));
  console.log(
    `Copied ${green(`${totals.audioCount}`)} files and created ${
      green(`${totals.dirsCount}`)
    } folders.`,
  );
}

function printDryRun(metadata: Metadata[], toPath: string): void {
  console.log(magenta("Dry run..."));
  console.log(magenta(`${metadata.length} files would be moved to:`));

  // TODO ask if full list should be printed?
  for (const m of metadata) {
    const { path, name, tags: { BPM, artist } } = m;

    if (BPM && artist) {
      console.log(createToPath(toPath, BPM, artist, path, name));
    } else {
      console.log(red(`Error: Missing tags for ${name}`));
    }
  }
}

function printMissingBPM(missingBPM: string[]): void {
  if (missingBPM.length > 0) {
    console.log(
      brightYellow(`\n${missingBPM.length} files missing a BPM tag:`),
    );
    for (const path of missingBPM) {
      console.log(path);
    }
    console.log();
  }
}

function printMissingArtist(missingArtist: string[]): void {
  if (missingArtist.length > 0) {
    console.log(
      brightCyan(`${missingArtist.length} files missing a Artist tag:`),
    );
    for (const path of missingArtist) {
      console.log(path);
    }
    console.log();
  }
}

function printFileTotals(
  totals: Totals,
): void {
  console.log(
    "Found",
    totals.audioCount,
    "audio files and",
    totals.dirsCount,
    "directories out of a total of",
    totals.allCount,
    "items.",
  );
}

export {
  printComplete,
  printDryRun,
  printFileTotals,
  printMissingArtist,
  printMissingBPM,
};
