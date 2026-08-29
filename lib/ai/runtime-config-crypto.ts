import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_DERIVATION_PREFIX = "moana-runtime-config:";

export type EncryptedRuntimeApiKey = {
  authTag: string;
  ciphertext: string;
  iv: string;
};

function deriveKey(secret: string | undefined): Buffer {
  if (typeof secret !== "string" || !secret.trim()) {
    throw new Error("Runtime config encryption secret is required");
  }

  return createHash("sha256")
    .update(`${KEY_DERIVATION_PREFIX}${secret}`, "utf8")
    .digest();
}

export function encryptRuntimeApiKey(
  value: string,
  secret = process.env.AUTH_SECRET
): EncryptedRuntimeApiKey {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  return {
    authTag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
  };
}

export function decryptRuntimeApiKey(
  payload: EncryptedRuntimeApiKey,
  secret = process.env.AUTH_SECRET
): string {
  const key = deriveKey(secret);

  try {
    if (
      !payload ||
      typeof payload.authTag !== "string" ||
      typeof payload.ciphertext !== "string" ||
      typeof payload.iv !== "string"
    ) {
      throw new Error("Invalid encrypted runtime API key payload");
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(payload.iv, "base64url")
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    throw new Error("Unable to decrypt runtime API key", { cause: error });
  }
}
