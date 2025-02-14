import { existsSync } from "@std/fs";

class ValidationError extends Error {
  constructor(...args: [string, ...(boolean | string)[]]) {
    const [message, ...rest] = args;

    const errorDetails = rest.filter(Boolean).join(", ");

    super(message + errorDetails);
    this.name = "ValidationError";
  }
}

function validateToAndFromDirectories(from?: string, to?: string): void {
  if (typeof from !== "string" || typeof to !== "string") {
    throw new ValidationError(
      "Missing required parameters: ",
      !from && "from",
      !to && "to",
    );
  }

  const invalidToPath = existsSync(to, { isFile: true });
  const invalidFromPath = existsSync(from, { isFile: true });

  if (invalidFromPath || invalidToPath) {
    throw new ValidationError(
      "Invalid directory paths: ",
      invalidFromPath && "from",
      invalidToPath && "to",
    );
  }
}

export { validateToAndFromDirectories };
