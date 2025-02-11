import { basename, extname, join } from "@std/path";
import { Metadata } from "../schemas/metadata.ts";
import { Tags, TagsSchema } from "../schemas/tags.ts";

type Folders = Map<string, string[]>;

const AUDIO_EXTENSIONS = new Set([".flac", ".mp3"]);

// TODO docs and tests
function getAudioFileTags(fromPath: string): Tags | null {
  const command = new Deno.Command("ffprobe", {
    args: [
      "-show_format",
      "-print_format",
      "json",
      fromPath,
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
function findAudioFiles(fromPath: string): Metadata[] {
  const audioFiles: Metadata[] = [];

  for (
    const f of Deno.readDirSync(fromPath)
  ) {
    const extension = extname(f.name);

    if (AUDIO_EXTENSIONS.has(extension)) {
      const path = join(fromPath, f.name);
      const tags = getAudioFileTags(path);

      if (tags) {
        audioFiles.push({ ...f, path, tags });
      }
    } else if (f.isDirectory) {
      const recursivePath = join(fromPath, f.name);

      audioFiles.push(...findAudioFiles(recursivePath));
    }
  }

  return audioFiles;
}

// TODO docs and tests
function analyseDirectoryStructure(
  metadata: Metadata[],
): { folders: Folders; missingBPM: string[]; missingArtist: string[] } {
  const folders: Folders = new Map();
  const missingBPM: string[] = [];
  const missingArtist: string[] = [];

  for (const m of metadata) {
    const { BPM, artist } = m.tags;

    if (!BPM) missingBPM.push(m.path);
    if (!artist) missingArtist.push(m.path);

    if (BPM && artist) {
      const nextValue = folders.has(BPM)
        ? [...(folders.get(BPM) ?? []), artist]
        : [artist];

      folders.set(BPM, nextValue);
    }
  }

  return { folders, missingBPM, missingArtist };
}

// TODO test + docs
function makeDirectoryStructure(
  folders: Folders,
  toPath: string,
): number {
  let foldersCreated = 0;

  function mkDir(path: string, options: Deno.MkdirOptions = {}): void {
    foldersCreated += 1;
    Deno.mkdirSync(path, options);
  }

  for (const [bpm, values] of folders.entries()) {
    mkDir(`${toPath}/${bpm}`, { recursive: true });

    for (const folder of values.values()) {
      mkDir(`${toPath}/${bpm}/${folder}`);
    }
  }

  return foldersCreated;
}

function copyAudioFiles(
  metadata: Metadata[],
  toPath: string,
): void {
  for (const m of metadata) {
    if (!m.tags.BPM || !m.tags.artist) continue;

    const filename = basename(m.path);

    Deno.copyFileSync(
      m.path,
      `${toPath}/${m.tags.BPM}/${m.tags.artist}/${filename}`,
    );
  }
}

export {
  analyseDirectoryStructure,
  copyAudioFiles,
  findAudioFiles,
  makeDirectoryStructure,
};
