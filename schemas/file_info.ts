import { z } from "zod";
import { TagsSchema } from "./tags.ts";

type FileInfo = z.infer<typeof FileInfoSchema>;

const DenoDirEntrySchema = z.custom<Deno.DirEntry>();

const FileInfoSchema = DenoDirEntrySchema.and(
  z.object({
    filePath: z.string(),
    tags: TagsSchema,
  }),
);

export { type FileInfo, FileInfoSchema };
