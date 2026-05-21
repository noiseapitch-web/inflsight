// OAuth 토큰 서명/검증 유틸
// crypto 모듈만 사용 (외부 의존성 없음)
import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.OAUTH_LINK_SECRET ?? "dev-secret-change-in-production";

export function generateInviteToken(creatorId: string): string {
  const nonce = randomBytes(8).toString("hex");
  const ts = Date.now().toString();
  const payload = `${creatorId}:${ts}:${nonce}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 24);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyInviteToken(token: string): { creatorId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;

    const [creatorId, ts, nonce, sig] = parts;
    const payload = `${creatorId}:${ts}:${nonce}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 24);
    if (sig !== expected) return null;

    // 24시간 만료
    if (Date.now() - parseInt(ts) > 86_400_000) return null;

    return { creatorId };
  } catch {
    return null;
  }
}

// access_token 간단 암호화 (XOR + base64 — 운영환경에서는 AES-256 권장)
export function encryptToken(token: string): string {
  const key = (process.env.TOKEN_ENCRYPTION_KEY ?? "default-key-change-me").slice(0, 32).padEnd(32, "0");
  const buf = Buffer.from(token, "utf8");
  const enc = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    enc[i] = buf[i] ^ key.charCodeAt(i % key.length);
  }
  return enc.toString("base64url");
}

export function decryptToken(encrypted: string): string {
  return encryptToken(Buffer.from(encrypted, "base64url").toString("utf8"));
}
