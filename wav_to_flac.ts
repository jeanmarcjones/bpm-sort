import { parseArgs } from "@std/cli";
import { basename, extname, join } from "@std/path";

const AUDIO_EXTENSIONS = new Set([".wav"]);

/**
 * @description Script to convert all wav files in a folder to the flac format.

 * @param {string[]} args - The script's arguments
 * */
async function main(args: string[]): Promise<void> {
  const { folder } = parseArgs(args, { string: ["folder"] });

  if (!folder) {
    console.log("Missing folder path");
    Deno.exit(1);
  }

  for await (const f of Deno.readDir(folder)) {
    const extension = extname(f.name);
    const fileName = basename(f.name, extension);

    if (AUDIO_EXTENSIONS.has(extension)) {
      const command = new Deno.Command("ffmpeg", {
        args: [
          "-i",
          join(folder, f.name),
          "-c:a",
          "flac",
          join(folder, fileName + ".flac"),
        ],
      });

      const { stderr, stdout, success } = command.outputSync();

      const out = new TextDecoder().decode(stdout);
      if (success) console.log("Done: ", out);

      const error = new TextDecoder().decode(stderr);
      if (error) console.log(error);
    }
  }
}

main(Deno.args);
