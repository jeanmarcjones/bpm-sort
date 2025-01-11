import * as stdPath from "jsr:@std/path";

export async function readDir(
  path = Deno.cwd(),
): Promise<Deno.DirEntry[]> {
  const home = Deno.env.get("HOME");
  if (!home) return [];

  const root = path.includes(Deno.cwd()) ? "" : home;
  const files = [];

  for await (
    const f of Deno.readDir(stdPath.join(root, path))
  ) {
    files.push(f);
  }

  return files;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const output = await readDir(Deno.args[0]);
  console.log(output.map((o) => o.name));
}
