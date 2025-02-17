import { brightCyan, brightYellow, green, magenta, red } from "@std/fmt/colors";
import { type Metadata } from "../schemas/metadata.ts";
import { createToPath } from "./misc.ts";

// TODO snapshot tests?

function printComplete(totalCopiedFiles: number, foldersCreated: number): void {
  console.log(green(`Complete...`));
  console.log(
    `Copied ${green(`${totalCopiedFiles}`)} files and created ${
      green(`${foldersCreated}`)
    } folders.`,
  );
}

function printDryRun(metadata: Metadata[], toPath: string): void {
  console.log(magenta("Dry run..."));
  console.log(magenta("Files would be moved to:"));

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
    console.log(brightYellow("\nFiles missing a BPM tag:"));
    for (const path of missingBPM) {
      console.log(path);
    }
    console.log();
  }
}

function printMissingArtist(missingArtist: string[]): void {
  if (missingArtist.length > 0) {
    console.log(brightCyan("Files missing a Artist tag:"));
    for (const path of missingArtist) {
      console.log(path);
    }
    console.log();
  }
}

export { printComplete, printDryRun, printMissingArtist, printMissingBPM };
