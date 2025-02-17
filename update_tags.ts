import { parseArgs } from "@std/cli";
import { extname, join } from "@std/path";
import { ensureDir } from "@std/fs";

const AUDIO_EXTENSIONS = new Set([".flac", ".mp3"]);

/**
 * @description Script to update incorrect audio tags from completions downloaded from bandcamp.

 * @param {string[]} args - The script's arguments
 * */
async function main(args: string[]): Promise<void> {
  const { from } = parseArgs(args, { string: ["from"] });

  if (!from) {
    console.log("Missing from path");
    Deno.exit(1);
  }

  for await (const f of Deno.readDir(from)) {
    const extension = extname(f.name);

    if (AUDIO_EXTENSIONS.has(extension) && !f.name.startsWith(".")) {
      await ensureDir(join(from, "updated"));

      const [artist, title] = f.name.split("-");
      const formattedArtist = artist.trim().slice(3);
      const formattedTitle = title.trim().slice(
        0,
        title.length - extension.length,
      );

      const command = new Deno.Command("ffmpeg", {
        args: [
          "-i",
          join(from, f.name),
          "-metadata",
          "ARTIST=" + formattedArtist,
          "-metadata",
          "TITLE=" + formattedTitle,
          "-y",
          join(from, "updated", f.name),
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
