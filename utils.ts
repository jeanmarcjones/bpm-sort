import { extname, join } from "@std/path";

type Folders = Map<string, string[]>;

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

const AUDIO_EXTENSIONS = new Set([".flac", ".mp3"]);

// TODO docs and tests
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
function findAudioFiles(path: string): FileInfo[] {
  const files: FileInfo[] = [];

  for (
    const f of Deno.readDirSync(path)
  ) {
    const extension = extname(f.name);

    if (AUDIO_EXTENSIONS.has(extension)) {
      const filePath = join(path, f.name);
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
function analyseDirectoryStructure(
  folders: Folders,
  fileInfo: FileInfo[],
): { missingBPM: string[]; missingArtist: string[] } {
  const missingBPM: string[] = [];
  const missingArtist: string[] = [];

  fileInfo.forEach((i) => {
    const bpmValue = i?.tags?.BPM || i?.tags?.TBPM;
    const artistValue = i.tags.ARTIST || i.tags.artist;

    if (!bpmValue) missingBPM.push(i.filePath);
    if (!artistValue) missingArtist.push(i.filePath);

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

  return { missingBPM, missingArtist };
}

// TODO test + docs
function makeDirectoryStructure(folders: Folders, output: string): void {
  for (const [bpm, values] of folders.entries()) {
    Deno.mkdirSync(`${output}/${bpm}`, { recursive: true });

    for (const folder of values.values()) {
      Deno.mkdirSync(`${output}/${bpm}/${folder}`);
    }
  }
}

export { analyseDirectoryStructure, findAudioFiles, makeDirectoryStructure };
