import { LearnerIdentity, StudentProgress } from '../types';

const ADMIN_STORAGE_KEY = 'mongo_quiz_admin_creds_v2';
const DEFAULT_ADMIN_PASSWORD = 'AdminEMTV';
const RECOVERY_PHRASE = '09018537763';
const INTEGRITY_SALT = 'EMTV_INTEGRITY_SALT_9901_SECURE';

/**
 * Fast synchronous SHA-256 implementation for browser data integrity and pseudonym hashing
 */
export function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeClearHex = '';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= (charCode & 0xff) << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

/**
 * Computes an integrity digest for student progress to prevent unauthorized browser DevTools score tampering
 */
export function computeProgressDigest(p: StudentProgress): string {
  const payload = `${p.learnerId.fingerprintHash}:${p.questionsAttempted}:${p.questionsCorrect}:${p.totalScore}:${p.currentStreak}:${p.longestStreak}:${INTEGRITY_SALT}`;
  return sha256Sync(payload);
}

/**
 * Validates progress checksum
 */
export function verifyProgressIntegrity(p: StudentProgress): boolean {
  if (!p.checksum) return true; // first time migration
  const calculated = computeProgressDigest(p);
  return p.checksum === calculated;
}

/**
 * Generates or loads stable pseudonymous identity
 */
export function getOrCreateLearnerIdentity(): LearnerIdentity {
  const IDENTITY_KEY = 'mongo_quiz_learner_id_v2';
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Stable client fingerprint
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const lang = navigator.language || 'en';
  const rawFingerprint = `${screenInfo}:${tz}:${lang}:${navigator.userAgent.slice(0, 50)}:${Date.now()}`;
  const hash = sha256Sync(rawFingerprint);
  const pseudonym = `MongoLearner-${hash.slice(0, 4).toUpperCase()}`;

  const identity: LearnerIdentity = {
    pseudonym,
    fingerprintHash: hash,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };

  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {}

  return identity;
}

/**
 * Admin Security Management
 * Default Password: "AdminEMTV"
 * Recovery Phrase: "09018537763"
 */
interface AdminCreds {
  passwordHash: string;
}

function getAdminCreds(): AdminCreds {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    passwordHash: sha256Sync(DEFAULT_ADMIN_PASSWORD)
  };
}

export function verifyAdminPassword(candidate: string): boolean {
  const creds = getAdminCreds();
  return sha256Sync(candidate.trim()) === creds.passwordHash;
}

export function changeAdminPassword(recoveryPhraseInput: string, newPassword: string): { success: boolean; message: string } {
  if (recoveryPhraseInput.trim() !== RECOVERY_PHRASE) {
    return {
      success: false,
      message: 'Invalid recovery phrase. Password modification rejected.'
    };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return {
      success: false,
      message: 'New password must be at least 6 characters long.'
    };
  }

  const updated: AdminCreds = {
    passwordHash: sha256Sync(newPassword.trim())
  };

  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
  return {
    success: true,
    message: 'Admin password successfully updated!'
  };
}
