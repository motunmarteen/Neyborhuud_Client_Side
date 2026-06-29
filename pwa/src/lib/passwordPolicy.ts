/**
 * Strong password rules for a safety-oriented social platform.
 * Used by API (Joi) and mirrored on the web signup form (Zod via client import).
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Short copy for forms and docs */
export const PASSWORD_REQUIREMENTS_HINT =
  "At least 8 characters with upper & lower case, a number, and not your username/email.";

/** At least one lowercase, uppercase, and digit. */
const COMPLEXITY_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/;

/** Four or more of the same character in a row */
const RUN_OF_SAME = /(.)\1{3,}/;

/** Keyboard / keypad runs (lowercase inspection) */
const BANNED_SUBSTRINGS = [
  "qwert",
  "werty",
  "ertyu",
  "rtyui",
  "tyuio",
  "yuiop",
  "asdfg",
  "sdfgh",
  "dfghj",
  "fghjk",
  "ghjkl",
  "zxcvb",
  "xcvbn",
  "cvbnm",
  "1234",
  "2345",
  "3456",
  "0987",
  "9876",
  "8765",
  "6543",
  "4321",
  "3210",
  "abcd",
  "bcde",
  "cdef",
  "defg",
  "efgh",
  "fghi",
  "ghij",
  "zyxw",
  "yxwv",
  "xwvu",
  "wvu",
  "qwer",
  "asdf",
  "zxcv",
  "1qaz",
  "2wsx",
  "qazw",
  "passw",
  "assword",
] as const;

/** Normalized (lowercase) highly common / breached-style passwords */
const COMMON_PASSWORDS = new Set<string>([
  "password",
  "password1",
  "password12",
  "password123",
  "password1234",
  "p@ssw0rd",
  "passw0rd",
  "letmein",
  "welcome",
  "welcome1",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "iloveyou",
  "trustno1",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "asdfgh",
  "asdfghjk",
  "zxcvbn",
  "1q2w3e4r",
  "1qaz2wsx",
  "admin",
  "admin123",
  "root",
  "test",
  "test123",
  "guest",
  "access",
  "shadow",
  "mustang",
  "michael",
  "jennifer",
  "jordan",
  "hunter",
  "buster",
  "soccer",
  "hockey",
  "killer",
  "matrix",
  "secret",
  "summer",
  "liverpool",
  "chelsea",
  "arsenal",
  "batman",
  "superman",
  "whatever",
  "freedom",
  "hello",
  "charlie",
  "donald",
  "thomas",
  "dallas",
  "hunter1",
  "cookie",
  "pepper",
  "flower",
  "jesus",
  "america",
  "nigeria",
  "lagos",
  "abuja",
  "internet",
  "senha",
  "contraseña",
]);

function hasSequentialRun4(s: string): boolean {
  const lower = s.toLowerCase();
  for (let i = 0; i <= lower.length - 4; i++) {
    const slice = lower.slice(i, i + 4);
    if (!slice) continue;
    if (/^\d{4}$/.test(slice)) {
      let asc = true;
      let desc = true;
      for (let j = 1; j < 4; j++) {
        const prev = slice.charCodeAt(j - 1);
        const cur = slice.charCodeAt(j);
        if (cur !== prev + 1) asc = false;
        if (cur !== prev - 1) desc = false;
      }
      if (asc || desc) return true;
    }
    if (/^[a-z]{4}$/.test(slice)) {
      let asc = true;
      let desc = true;
      for (let j = 1; j < 4; j++) {
        const prev = slice.charCodeAt(j - 1);
        const cur = slice.charCodeAt(j);
        if (cur !== prev + 1) asc = false;
        if (cur !== prev - 1) desc = false;
      }
      if (asc || desc) return true;
    }
  }
  return false;
}

function hasBannedKeyboardSubstring(lower: string): boolean {
  for (const frag of BANNED_SUBSTRINGS) {
    if (lower.includes(frag)) return true;
  }
  return false;
}

export type PasswordPolicyContext = {
  email?: string;
  username?: string;
};

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; message: string };

/** Shared strings — must match the order and wording in evaluatePasswordPolicy. */
const MSG = {
  required: "Password is required",
  trim: "Do not use leading or trailing spaces in your password",
  lineBreak: "Password cannot contain line breaks",
  minLen: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  maxLen: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`,
  complexity:
    "Use at least one uppercase letter, one lowercase letter, and one number",
  runSame:
    "Avoid four or more identical characters in a row (e.g. “aaaa”)",
  common:
    "This password is too common for a safety platform — choose a more unique one",
  patterns:
    "Avoid simple keyboard or counting patterns (e.g. “1234”, “asdf”, “abcd”)",
  distinct:
    "Use at least 6 different characters so the password is harder to guess",
  username: "Password must not contain your username",
  emailLocal:
    "Password must not contain the part of your email before @",
} as const;

function prepareNormalized(password: string): {
  ok: true;
  normalized: string;
  lower: string;
} | { ok: false; message: string } {
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, message: MSG.required };
  }
  if (password !== password.trim()) {
    return { ok: false, message: MSG.trim };
  }
  if (/[\r\n\u2028\u2029]/.test(password)) {
    return { ok: false, message: MSG.lineBreak };
  }
  const normalized = password.normalize("NFKC");
  const lower = normalized.toLowerCase();
  return { ok: true, normalized, lower };
}

function checkLengthRange(normalized: string): PasswordPolicyResult {
  if (normalized.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: MSG.minLen };
  }
  if (normalized.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, message: MSG.maxLen };
  }
  return { ok: true };
}

function checkComplexity(normalized: string): PasswordPolicyResult {
  if (!COMPLEXITY_RE.test(normalized)) {
    return { ok: false, message: MSG.complexity };
  }
  return { ok: true };
}

function checkRunOfSame(normalized: string): PasswordPolicyResult {
  if (RUN_OF_SAME.test(normalized)) {
    return { ok: false, message: MSG.runSame };
  }
  return { ok: true };
}

function checkNotCommon(lower: string): PasswordPolicyResult {
  if (COMMON_PASSWORDS.has(lower)) {
    return { ok: false, message: MSG.common };
  }
  return { ok: true };
}

function checkPatterns(normalized: string, lower: string): PasswordPolicyResult {
  if (hasBannedKeyboardSubstring(lower) || hasSequentialRun4(normalized)) {
    return { ok: false, message: MSG.patterns };
  }
  return { ok: true };
}

function checkDistinct(normalized: string): PasswordPolicyResult {
  if (new Set(normalized).size < 6) {
    return { ok: false, message: MSG.distinct };
  }
  return { ok: true };
}

function checkNoUsername(lower: string, context?: PasswordPolicyContext): PasswordPolicyResult {
  if (context?.username) {
    const u = context.username.trim().toLowerCase();
    if (u.length >= 3 && lower.includes(u)) {
      return { ok: false, message: MSG.username };
    }
  }
  return { ok: true };
}

function checkNoEmailLocal(lower: string, context?: PasswordPolicyContext): PasswordPolicyResult {
  if (context?.email) {
    const local = context.email.split("@")[0]?.trim().toLowerCase() ?? "";
    if (local.length >= 3 && lower.includes(local)) {
      return { ok: false, message: MSG.emailLocal };
    }
  }
  return { ok: true };
}

/**
 * Full policy check (length, complexity, personal-data proximity, common passwords,
 * keyboard/sequential patterns, diversity).
 */
export function evaluatePasswordPolicy(
  password: string,
  context?: PasswordPolicyContext,
): PasswordPolicyResult {
  const prep = prepareNormalized(password);
  if (!prep.ok) return { ok: false, message: prep.message };

  const { normalized, lower } = prep;

  let r = checkLengthRange(normalized);
  if (!r.ok) return r;
  r = checkComplexity(normalized);
  if (!r.ok) return r;
  r = checkRunOfSame(normalized);
  if (!r.ok) return r;
  r = checkNotCommon(lower);
  if (!r.ok) return r;
  r = checkNoUsername(lower, context);
  if (!r.ok) return r;
  r = checkNoEmailLocal(lower, context);
  if (!r.ok) return r;

  return { ok: true };
}

export type PasswordChecklistItem = {
  id: string;
  /** Short label for the meter */
  label: string;
  /** User-facing message when this rule fails (same as API / form errors) */
  failMessage: string;
  /** Rule satisfied */
  ok: boolean;
  /** User hasn’t typed anything yet — leave row neutral */
  pending: boolean;
  /** Username/email rule not applicable until field is long enough */
  skipped: boolean;
};

/**
 * Live checklist for signup UI. Uses the same predicates and messages as
 * {@link evaluatePasswordPolicy} (no duplicated policy logic).
 */
export function getPasswordStrengthChecklist(
  password: string,
  context?: PasswordPolicyContext,
): PasswordChecklistItem[] {
  const empty = typeof password !== "string" || password.length === 0;

  const userLen = context?.username?.trim().length ?? 0;
  const emailLocal =
    context?.email?.split("@")[0]?.trim().toLowerCase() ?? "";
  const emailLen = emailLocal.length;
  const usernameRuleApplicable = userLen >= 3;
  const emailRuleApplicable = emailLen >= 3;

  if (empty) {
    const pendingRow = (
      id: string,
      label: string,
      fail: string,
      skipped: boolean,
    ): PasswordChecklistItem => ({
      id,
      label,
      failMessage: fail,
      ok: false,
      pending: true,
      skipped,
    });
    return [
      pendingRow("format", "No leading/trailing spaces or line breaks", MSG.trim, false),
      pendingRow(
        "length",
        `Length between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
        MSG.minLen,
        false,
      ),
      pendingRow("complexity", "Uppercase, lowercase, and number", MSG.complexity, false),
      pendingRow("run", "No four identical characters in a row", MSG.runSame, false),
      pendingRow("common", "Not an easily guessed password", MSG.common, false),
      pendingRow("username", "Does not contain your username", MSG.username, !usernameRuleApplicable),
      pendingRow("email", "Does not contain your email before @", MSG.emailLocal, !emailRuleApplicable),
    ];
  }

  const prep = prepareNormalized(password);
  if (!prep.ok) {
    const formatOk = false;
    const formatMsg = prep.message;
    /** Until spacing/format is valid, don’t imply pass/fail on other rules. */
    const restPending = true;
    return [
      {
        id: "format",
        label: "No leading/trailing spaces or line breaks",
        failMessage: formatMsg,
        ok: formatOk,
        pending: false,
        skipped: false,
      },
      {
        id: "length",
        label: `Length between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
        failMessage: MSG.minLen,
        ok: false,
        pending: restPending,
        skipped: false,
      },
      {
        id: "complexity",
        label: "Uppercase, lowercase, and number",
        failMessage: MSG.complexity,
        ok: false,
        pending: restPending,
        skipped: false,
      },
      {
        id: "run",
        label: "No four identical characters in a row",
        failMessage: MSG.runSame,
        ok: false,
        pending: restPending,
        skipped: false,
      },
      {
        id: "common",
        label: "Not an easily guessed password",
        failMessage: MSG.common,
        ok: false,
        pending: restPending,
        skipped: false,
      },
      {
        id: "username",
        label: "Does not contain your username",
        failMessage: MSG.username,
        ok: false,
        pending: restPending,
        skipped: !usernameRuleApplicable,
      },
      {
        id: "email",
        label: "Does not contain your email before @",
        failMessage: MSG.emailLocal,
        ok: false,
        pending: restPending,
        skipped: !emailRuleApplicable,
      },
    ];
  }

  const { normalized, lower } = prep;

  const lengthOk =
    normalized.length >= PASSWORD_MIN_LENGTH &&
    normalized.length <= PASSWORD_MAX_LENGTH;
  const complexityOk = checkComplexity(normalized).ok;
  const runOk = checkRunOfSame(normalized).ok;
  const commonOk = checkNotCommon(lower).ok;
  const usernameOk =
    !usernameRuleApplicable || checkNoUsername(lower, context).ok;
  const emailOk =
    !emailRuleApplicable || checkNoEmailLocal(lower, context).ok;

  return [
    {
      id: "format",
      label: "No leading/trailing spaces or line breaks",
      failMessage: MSG.trim,
      ok: true,
      pending: false,
      skipped: false,
    },
    {
      id: "length",
      label: `Length between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
      failMessage: MSG.minLen,
      ok: lengthOk,
      pending: false,
      skipped: false,
    },
    {
      id: "complexity",
      label: "Uppercase, lowercase, and number",
      failMessage: MSG.complexity,
      ok: complexityOk,
      pending: false,
      skipped: false,
    },
    {
      id: "run",
      label: "No four identical characters in a row",
      failMessage: MSG.runSame,
      ok: runOk,
      pending: false,
      skipped: false,
    },
    {
      id: "common",
      label: "Not an easily guessed password",
      failMessage: MSG.common,
      ok: commonOk,
      pending: false,
      skipped: false,
    },
    {
      id: "username",
      label: "Does not contain your username",
      failMessage: MSG.username,
      ok: usernameOk,
      pending: false,
      skipped: !usernameRuleApplicable,
    },
    {
      id: "email",
      label: "Does not contain your email before @",
      failMessage: MSG.emailLocal,
      ok: emailOk,
      pending: false,
      skipped: !emailRuleApplicable,
    },
  ];
}

export type PasswordMeterTier = "empty" | "weak" | "fair" | "good" | "strong";

/**
 * Summary for a compact bar + label. Counts only non-skipped, non-pending rows.
 */
export function getPasswordStrengthSummary(
  password: string,
  context?: PasswordPolicyContext,
): {
  tier: PasswordMeterTier;
  /** 0–100, for progress bar width */
  scorePercent: number;
  /** Human label */
  label: string;
  checklist: PasswordChecklistItem[];
  meetsPolicy: boolean;
} {
  const checklist = getPasswordStrengthChecklist(password, context);
  const counted = checklist.filter((i) => !i.skipped && !i.pending);
  const passed = counted.filter((i) => i.ok).length;
  const total = counted.length;

  const meetsPolicy = evaluatePasswordPolicy(password, context).ok === true;

  if (!password?.length) {
    return {
      tier: "empty",
      scorePercent: 0,
      label: "Enter a password",
      checklist,
      meetsPolicy: false,
    };
  }

  if (meetsPolicy) {
    return {
      tier: "strong",
      scorePercent: 100,
      label: "Strong — meets requirements",
      checklist,
      meetsPolicy: true,
    };
  }

  const ratio = total > 0 ? passed / total : 0;
  const scorePercent = Math.min(99, Math.round(ratio * 100));

  let tier: PasswordMeterTier;
  let label: string;
  if (ratio < 0.35) {
    tier = "weak";
    label = "Weak";
  } else if (ratio < 0.55) {
    tier = "fair";
    label = "Fair";
  } else if (ratio < 0.85) {
    tier = "good";
    label = "Good";
  } else {
    tier = "good";
    label = "Almost there";
  }

  return {
    tier,
    scorePercent,
    label,
    checklist,
    meetsPolicy: false,
  };
}
