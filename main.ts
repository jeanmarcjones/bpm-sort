import * as stdPath from "jsr:@std/path";

// TODO tags types
interface FileInfo extends Deno.DirEntry {
  filePath: string;
  tags: any
}

const audioExtensions = new Set([".flac", ".mp3"]);

function getAudioFileTags(filePath: string) {
  const command = new Deno.Command("ffprobe", {
    args: [
      "-show_format",
      "-print_format",
      "json",
      filePath,
    ],
  });
  const { stdout, success } = command.outputSync();

  if (success) {
    // TODO Check Types
    const metaData = JSON.parse(new TextDecoder().decode(stdout));
    const filteredTags = { ...metaData?.format?.tags };

    // FLAC traktor tags
    delete filteredTags.TRAKTOR4;

    // MP3 traktor tags
    Object.keys(filteredTags).forEach(key => {
      if (key.includes("id3v2_priv.")) {
        delete filteredTags[key];
      }
    });

    return filteredTags;
  } else {
    return null;
  }
}

export function findAudioFiles(
  path = Deno.cwd(),
): FileInfo[] {
  const homePath = Deno.env.get("HOME");
  if (!homePath) return [];

  const root = path.includes(Deno.cwd()) ? "" : homePath;
  const files = [];

  for (
    const f of Deno.readDirSync(stdPath.join(root, path))
  ) {
    const extension = stdPath.extname(f.name);

    if (audioExtensions.has(extension)) {
      const filePath = stdPath.join(root, path, f.name);
      const tags = getAudioFileTags(filePath);

      files.push({ ...f, filePath, tags });
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
