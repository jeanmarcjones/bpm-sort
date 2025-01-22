import { extname, join } from "@std/path";
import { emptyDirSync } from "@std/fs";
import { type Args, parseArgs } from "@std/cli/parse-args";

// TODO move functions to utils folder
// TODO explicit return
// TODO import sort

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
export function findAudioFiles(path: string): FileInfo[] {
  const files = [];

  for (
    const f of Deno.readDirSync(path)
  ) {
    const extension = extname(f.name);

    if (audioExtensions.has(extension)) {
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
function makeDirectoryStructure(): void {
  for (const [bpm, values] of folders.entries()) {
    Deno.mkdirSync(`./out/${bpm}`);

    for (const folder of values.values()) {
      Deno.mkdirSync(`./out/${bpm}/${folder}`);
    }
  }
}

function parseArguments(args: string[]): Args {
  const stringArgs = [
    "input",
    "output",
  ];

  // TODO alias

  return parseArgs(args, {
    string: stringArgs,
  });
}

function main(inputArgs: string[]): void {
  if (import.meta.main) {
    // TODO handle folders already existing
    emptyDirSync("./out");

    const { input } = parseArguments(inputArgs);

    const fileMetaData = findAudioFiles(input);
    analyseDirectoryStructure(fileMetaData);

    makeDirectoryStructure();

    // TODO decide on approach for moving audio file

    for (const dirEntry of Deno.readDirSync("./out")) {
      console.log("Basic listing:", dirEntry.name);
    }
  }
}

main(Deno.args);
