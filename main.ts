import * as stdPath from "jsr:@std/path";

const audioExtensions = new Set([".flac", ".mp3"]);

function readTags() {
}

export function findAudioFiles(
  path = Deno.cwd(),
): Deno.DirEntry[] {
  const homePath = Deno.env.get("HOME");
  if (!homePath) return [];

  const root = path.includes(Deno.cwd()) ? "" : homePath;
  const files = [];

  for (
    const f of Deno.readDirSync(stdPath.join(root, path))
  ) {
    const extension = stdPath.extname(f.name);

    if (audioExtensions.has(extension)) {
      files.push(f);
    } else if (f.isDirectory) {
      const recursivePath = stdPath.join(path, f.name);
      files.push(...findAudioFiles(recursivePath));
    }
  }

  return files;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const output = findAudioFiles(Deno.args[0]);
  console.log(output);
}
