import { existsSync } from "@std/fs";
import { red } from "@std/fmt/colors";

function validateToAndFromDirectories(from: string, to: string): void {
  const invalidToPath = existsSync(to, { isFile: true });
  const invalidFromPath = existsSync(from, { isFile: true });

  if (invalidFromPath || invalidToPath) {
    console.log(red("Error: invalid path"));
    invalidFromPath && console.log(red("From must be a valid directory."));
    invalidToPath && console.log(red("To must be a valid directory."));
    Deno.exit(1);
  }
}

export { validateToAndFromDirectories };
