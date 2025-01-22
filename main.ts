import { join, extname } from "@std/path";
import { emptyDirSync } from "@std/fs";

// TODO move functions to utils folder

interface Tags {
  BPM?: string;
  TBPM?: string;
  ARTIST?: string;
  artist?: string;
}

interface FileInfo extends Deno.DirEntry {
  filePath: string;
  tags: Tags;
}

const audioExtensions = new Set([".flac", ".mp3"]);

const folders = new Map<string, string[]>();

// TODO docs and tests
// TODO handle unescaped special charters in the path
function getAudioFileTags(filePath: string): Tags | null {
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
    // TODO Validate metadata with ZOD
    const metaData = JSON.parse(new TextDecoder().decode(stdout));
    const filteredTags = { ...metaData?.format?.tags };

    // FLAC traktor tags
    delete filteredTags.TRAKTOR4;

    // MP3 traktor tags
    Object.keys(filteredTags).forEach((key) => {
      if (key.includes("id3v2_priv.")) {
        delete filteredTags[key];
      }
    });

    return filteredTags;
  } else {
    return null;
  }
}

// TODO docs and tests
export function findAudioFiles(
  path = Deno.cwd(),
): FileInfo[] {
  const homePath = Deno.env.get("HOME");

  const root = path.includes(Deno.cwd()) ? "" : String(homePath);
  const files = [];

  for (
    const f of Deno.readDirSync(join(root, path))
  ) {
    const extension = extname(f.name);

    if (audioExtensions.has(extension)) {
      const filePath = join(root, path, f.name);
      const tags = getAudioFileTags(filePath);

      if (tags) {
        files.push({ ...f, filePath, tags });
      }
    } else if (f.isDirectory) {
      const recursivePath = join(path, f.name);

      files.push(...findAudioFiles(recursivePath));
    }
  }

  return files;
}

// TODO docs and tests
function analyseDirectoryStructure(fileInfo: FileInfo[]): void {
  fileInfo.forEach((i) => {
    const bpmValue = i?.tags?.BPM || i?.tags?.TBPM;
    const artistValue = i.tags.ARTIST || i.tags.artist;

    // TODO log files that are missing a bpm or artist

    if (bpmValue && artistValue) {
      const parsedArtist = artistValue.toLowerCase().replace(
        /[^a-zA-Z\s]/g,
        "",
      );

      const nextValue = folders.has(bpmValue)
        ? [...(folders.get(bpmValue) ?? []), parsedArtist]
        : [parsedArtist];

      folders.set(bpmValue, nextValue);
    }
  });
}

// TODO test + docs
// TODO take output location as an argument
function makeDirectoryStructure() {
  for (const [bpm, value] of folders.entries()) {
    Deno.mkdirSync(`./out/${bpm}`);

    for (const folder of value.values()) {
      Deno.mkdirSync(`./out/${bpm}/${folder}`);
    }
  }
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  // TODO handle folders already existing
  emptyDirSync("./out");

  const fileMetaData = findAudioFiles(Deno.args[0]);
  analyseDirectoryStructure(fileMetaData);

  makeDirectoryStructure()

  // TODO decide on approach for moving audio file

  for await (const dirEntry of Deno.readDirSync("./out")) {
    console.log("Basic listing:", dirEntry.name);
  }
}
