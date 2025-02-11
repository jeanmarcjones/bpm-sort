import { green, magenta } from "@std/fmt/colors";
import { type Metadata } from "../schemas/metadata.ts";
import { basename } from "@std/path/basename";

function printComplete(totalCopiedFiles: number, foldersCreated: number): void {
  console.log(green(`Complete...`));
  console.log(
    `Copied ${green(`${totalCopiedFiles}`)} files and created ${
      green(`${foldersCreated}`)
    } folders.`,
  );
}

function printDryRun(copiedFiles: Metadata[], toPath: string): void {
  console.log(magenta("Dry run..."));
  console.log(magenta("Files would be moved to:"));

  // TODO ask if full list should be printed?
  for (const file of copiedFiles) {
    const filename = basename(file.path);
    console.log(`${toPath}/${file.tags.BPM}/${file.tags.artist}/${filename}`);
  }
}

export { printComplete, printDryRun };
