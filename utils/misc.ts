import { dirname, extname, join } from "@std/path";
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

      // TODO validate path

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

// TODO tests
/**
 * @description Creates a structured file path based on metadata information.
 *
 * @param {string} toDir - The base directory where files will be stored
 * @param {string} BPM - The beats per minute value used in the directory structure
 * @param {string} artist - The artist name used in the directory structure
 * @param {string} path - Original file path used to determine format-specific directories
 * @param {string} fileName - The filename with extension
 *
 * @returns {string} A formatted path combining directory, BPM, artist, and filename.
 * For MP3 files, includes an 'mp3' subdirectory level.
 */
function createToPath(
  toDir: string,
  BPM: string,
  artist: string,
  path: string,
  fileName: string,
): string {
  const mp3Dir = extname(path).toLowerCase() === ".mp3" ? "mp3" : "";
  return join(
    toDir,
    BPM,
    artist,
    mp3Dir,
    fileName,
  );
}

// TODO docs + tests
function copyAudioFiles(
  metadata: Metadata[],
  toDir: string,
): void {
  for (const m of metadata) {
    const { path, name, tags: { BPM, artist } } = m;

    if (BPM && artist) {
      const toPath = createToPath(toDir, BPM, artist, path, name);

      const dir = dirname(toPath);
      ensureDirSync(dir);

      Deno.copyFileSync(path, toPath);
    } else {
      const missingTagPath = join(toDir, "00-missing-tags", name);

      const dir = dirname(missingTagPath);
      ensureDirSync(dir);

      Deno.copyFileSync(path, missingTagPath);
    }
  }
}

// TODO tests
/**
 * @description Counts the total number of directories in a specified path recursively.
 *
 * @param {string} toPath - The path to start counting directories from
 * @returns {number} The total number of directories found
 */
function countDirectories(toPath: string): number {
  // walk includes the paths root directory
  let dirCount = -1;

  for (const _entry of walkSync(toPath, { includeFiles: false })) {
    dirCount += 1;
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
