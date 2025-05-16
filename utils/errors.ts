import { existsSync } from "@std/fs";

class ValidationError extends Error {
  constructor(...args: [string, ...(boolean | string)[]]) {
    const [message, ...rest] = args;

    const errorDetails = rest.filter(Boolean).join(", ");

    super(message + errorDetails);
    this.name = "ValidationError";
  }
}

function validateToAndFromDirectories(fromDirs: string[], to: unknown): void {
  if (typeof to !== "string") {
    throw new ValidationError(
      "Missing required parameters: ",
      !to && "to",
    );
  }

  const invalidSources = fromDirs.filter((dir) =>
    !existsSync(dir, { isDirectory: true })
  );
  const invalidTo = !existsSync(to, { isDirectory: true });

  if (invalidSources.length > 0 || invalidTo) {
    throw new ValidationError(
      "Invalid directory paths: ",
      invalidSources.length > 0 && `source(s) - ${invalidSources.join(", ")}`,
      invalidTo && "destination (to)",
    );
  }
}

export { validateToAndFromDirectories };
