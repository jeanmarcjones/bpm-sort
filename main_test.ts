import { assertEquals,  } from "@std/assert";
import { readFiles } from "./main.ts";

Deno.test(async function readFilesTest() {
  console.log(await readFiles())
  assertEquals((await readFiles()).length, 6);
});
