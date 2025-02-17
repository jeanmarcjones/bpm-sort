import { dirname, extname, join } from "@std/path";
import { Metadata } from "../schemas/metadata.ts";
import { Tags, TagsSchema } from "../schemas/tags.ts";
import { ensureDir, walk } from "@std/fs";

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
async function findAudioFiles(fromPath: string): Promise<Metadata[]> {
  const audioFiles: Metadata[] = [];

  for await (const f of Deno.readDir(fromPath)) {
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

      audioFiles.push(...(await findAudioFiles(recursivePath)));
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

/**
 * @description Rounds down a BPM value to the nearest ten.

 * @param {string} BPM - The Beats Per Minute value to round down
 * @returns {string} The rounded down BPM value
 */
function roundDownBPM(BPM: string): string {
  const parsedBPM = Number(BPM);
  return String(Math.floor(parsedBPM / 10) * 10);
}

// TODO docs + tests
async function copyAudioFiles(
  metadata: Metadata[],
  toDir: string,
): Promise<void> {
  for (const m of metadata) {
    const { path, name, tags: { BPM, artist } } = m;

    if (BPM && artist) {
      const toPath = createToPath(toDir, roundDownBPM(BPM), artist, path, name);

      const dir = dirname(toPath);
      await ensureDir(dir);

      await Deno.copyFile(path, toPath);
    } else {
      const missingTagPath = join(toDir, "00-missing-tags", name);

      const dir = dirname(missingTagPath);
      await ensureDir(dir);

      await Deno.copyFile(path, missingTagPath);
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
async function countDirectories(toPath: string): Promise<number> {
  // walk includes the paths root directory
  let dirCount = -1;

  for await (const _entry of walk(toPath, { includeFiles: false })) {
    dirCount += 1;
  }

  return dirCount;
}

async function countAudioFiles(toPath: string): Promise<number> {
  let dirCount = 0;

  for await (const entry of walk(toPath, { includeDirs: false })) {
    const extension = extname(entry.name);

    if (AUDIO_EXTENSIONS.has(extension)) {
      dirCount += 1;
    }
  }

  return dirCount;
}

export {
  copyAudioFiles,
  countAudioFiles,
  countDirectories,
  createToPath,
  findAudioFiles,
  findMissingTags,
};
