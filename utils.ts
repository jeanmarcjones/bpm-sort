import { basename, extname, join } from "@std/path";
import { FileInfo } from "./schemas/file_info.ts";
import { Tags, TagsSchema } from "./schemas/tags.ts";

type Folders = Map<string, string[]>;

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

  if (!success) return null;

  const metaData = JSON.parse(new TextDecoder().decode(stdout));

  const parsedData = TagsSchema.safeParse(metaData?.format?.tags);

  if (!parsedData.success) return null;

  return parsedData.data;
}

// TODO docs and tests
function findAudioFiles(path: string): FileInfo[] {
  const audioFiles: FileInfo[] = [];

  for (
    const f of Deno.readDirSync(path)
  ) {
    const extension = extname(f.name);

    if (AUDIO_EXTENSIONS.has(extension)) {
      const filePath = join(path, f.name);
      const tags = getAudioFileTags(filePath);

      if (tags) {
        audioFiles.push({ ...f, filePath, tags });
      }
    } else if (f.isDirectory) {
      const recursivePath = join(path, f.name);

      audioFiles.push(...findAudioFiles(recursivePath));
    }
  }

  return audioFiles;
}

// TODO docs and tests
function analyseDirectoryStructure(
  fileInfo: FileInfo[],
): { folders: Folders; missingBPM: string[]; missingArtist: string[] } {
  const folders: Folders = new Map();
  const missingBPM: string[] = [];
  const missingArtist: string[] = [];

  fileInfo.forEach((i) => {
    const { BPM, artist } = i.tags;

    if (!BPM) missingBPM.push(i.filePath);
    if (!artist) missingArtist.push(i.filePath);

    if (BPM && artist) {
      const nextValue = folders.has(BPM)
        ? [...(folders.get(BPM) ?? []), artist]
        : [artist];

      folders.set(BPM, nextValue);
    }
  });

  return { folders, missingBPM, missingArtist };
}

// TODO test + docs
function makeDirectoryStructure(folders: Folders, outPath: string): void {
  for (const [bpm, values] of folders.entries()) {
    Deno.mkdirSync(`${outPath}/${bpm}`, { recursive: true });

    for (const folder of values.values()) {
      Deno.mkdirSync(`${outPath}/${bpm}/${folder}`);
    }
  }
}

function copyAudioFiles(
  metaData: FileInfo[],
  outPath: string,
): void {
  for (const meta of metaData) {
    if (!meta.tags.BPM || !meta.tags.artist) continue;

    const filename = basename(meta.filePath);

    Deno.copyFileSync(
      meta.filePath,
      `${outPath}/${meta.tags.BPM}/${meta.tags.artist}/${filename}`,
    );
  }
}

export {
  analyseDirectoryStructure,
  copyAudioFiles,
  findAudioFiles,
  makeDirectoryStructure,
};
