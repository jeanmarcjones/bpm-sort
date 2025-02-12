import { basename, dirname, extname, join } from "@std/path";
import { Metadata } from "../schemas/metadata.ts";
import { Tags, TagsSchema } from "../schemas/tags.ts";
import { ensureDirSync, walkSync } from "@std/fs";

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
function findMissingTags(
  metadata: Metadata[],
): { missingBPM: string[]; missingArtist: string[] } {
  const missingBPM: string[] = [];
  const missingArtist: string[] = [];

  for (const m of metadata) {
    const { BPM, artist } = m.tags;

    if (!BPM) missingBPM.push(m.path);
    if (!artist) missingArtist.push(m.path);
  }

  return { missingBPM, missingArtist };
}

// TODO docs + tests
function createToPath(toDir: string, metadata: Metadata): string {
  const mp3Dir = extname(metadata.path).toLowerCase() === ".mp3" ? "/mp3" : "";
  const filename = basename(metadata.path);
  return `${toDir}/${metadata.tags.BPM}/${metadata.tags.artist}${mp3Dir}/${filename}`;
}

// TODO docs + tests
function copyAudioFiles(
  metadata: Metadata[],
  toDir: string,
): void {
  for (const m of metadata) {
    if (!m.tags.BPM || !m.tags.artist) continue;

    const toPath = createToPath(toDir, m);

    const dir = dirname(toPath);
    ensureDirSync(dir);

    Deno.copyFileSync(m.path, toPath);
  }
}

// TODO docs + tests
function countDirectories(toPath: string): number {
  let dirCount = 0;

  for (const entry of walkSync(toPath)) {
    if (entry.isDirectory) {
      dirCount += 1;
    }
  }

  return dirCount;
}

export {
  copyAudioFiles,
  countDirectories,
  createToPath,
  findAudioFiles,
  findMissingTags,
};
