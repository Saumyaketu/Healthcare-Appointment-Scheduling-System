import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString("base64");
  const signature = crypto
    .createHmac("sha256", "novaslot-secret-key-2026")
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", "novaslot-secret-key-2026")
      .update(payloadBase64)
      .digest("hex");

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
    if (payload.exp < Date.now()) return null;

    return { userId: payload.userId };
  } catch {
    return null;
  }
}
