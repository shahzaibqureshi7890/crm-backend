import dotenv from "dotenv";
import type { Secret } from "jsonwebtoken";
import type { StringValue } from "ms";

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}

const rawExpiresIn = process.env.JWT_EXPIRES_IN ?? "1d";

const JWT_EXPIRES_IN: StringValue = rawExpiresIn as StringValue;

export { JWT_SECRET, JWT_EXPIRES_IN };
