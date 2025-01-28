import { z } from "zod";
import { TagsSchema } from "./tags.ts";

type Metadata = z.infer<typeof MetadataSchema>;

const DenoDirEntrySchema = z.custom<Deno.DirEntry>();

const MetadataSchema = DenoDirEntrySchema.and(
  z.object({
    path: z.string(),
    tags: TagsSchema,
  }),
);

export { type Metadata, MetadataSchema };
