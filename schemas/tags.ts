import { z } from "zod";

type Tags = z.infer<typeof TagsSchema>;

function formatArtist(value?: string): string | undefined {
  switch (typeof value) {
    case ("string"): {
      return value?.toLowerCase().replace(
        /[^a-zA-Z\s]/g,
        "",
      );
    }
    default: {
      return undefined;
    }
  }
}

const TagsSchema = z.object({
  BPM: z.string().optional(),
  TBPM: z.string().optional(),
  ARTIST: z.string().optional(),
  artist: z.string().optional(),
}).transform((t) => ({
  BPM: t.BPM ?? t.TBPM,
  artist: formatArtist(t.ARTIST ?? t.artist),
}));

export { type Tags, TagsSchema };
