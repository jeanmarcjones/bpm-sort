import { assertEquals,  } from "@std/assert";
import { findAudioFiles } from "./main.ts";

Deno.test(function findAudioFilesTest() {
  assertEquals((findAudioFiles()).length, 0);
});
