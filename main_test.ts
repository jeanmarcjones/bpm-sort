import { assertEquals } from "@std/assert";
import { findAudioFiles } from "./utils/misc.ts";

Deno.test("No audio files", async function findAudioFilesTest(): Promise<void> {
  assertEquals((await findAudioFiles("./")).length, 0);
});
