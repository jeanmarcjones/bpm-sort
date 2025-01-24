import { assertEquals } from "@std/assert";
import { findAudioFiles } from "./utils.ts";

Deno.test("No audio files", function findAudioFilesTest(): void {
  assertEquals((findAudioFiles("./")).length, 0);
});
