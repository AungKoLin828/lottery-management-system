/**
 * ============================================================
 * MYANMAR PHONE NUMBER UTILITIES
 * ============================================================
 *
 * Supported input:
 *
 * 09xxxxxxxxx
 * 09 xxx xxx xxx
 * 09-xxx-xxx-xxx
 * 959xxxxxxxxx
 * +959xxxxxxxxx
 * +95 9 xxx xxx xxx
 * 00959123456789
 *
 * Output:
 *
 * +959xxxxxxxxx
 *
 * Example:
 *
 * 09123456789
 *      ↓
 * +959123456789
 * ============================================================
 */

const MYANMAR_COUNTRY_CODE = "95";

/**
 * Myanmar mobile prefixes.
 *
 * These are used for numbering-format validation.
 */
const MYANMAR_MOBILE_PREFIXES = [
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
];

/**
 * ============================================================
 * CLEAN PHONE
 * ============================================================
 *
 * Removes common formatting characters.
 *
 * Example:
 *
 * "09 123-456-789"
 *      ↓
 * "09123456789"
 */
function cleanPhone(phone: string): string {
  return phone.trim().replace(/[\s\-().]/g, "");
}

/**
 * ============================================================
 * NORMALIZE MYANMAR PHONE
 * ============================================================
 *
 * Converts supported Myanmar phone formats to E.164.
 *
 * Examples:
 *
 * 09123456789
 *      ↓
 * +959123456789
 *
 * 09 123 456 789
 *      ↓
 * +959123456789
 *
 * 959123456789
 *      ↓
 * +959123456789
 *
 * +959123456789
 *      ↓
 * +959123456789
 *
 * 00959123456789
 *      ↓
 * +959123456789
 */
export function normalizeMyanmarPhone(phone: string): string {
  let value = cleanPhone(phone);

  if (!value) {
    return "";
  }

  /**
   * International dialing prefix:
   *
   * 00959123456789
   * ↓
   * +959123456789
   */
  if (value.startsWith("00")) {
    value = `+${value.substring(2)}`;
  }

  /**
   * Remove + temporarily.
   */
  const withoutPlus = value.startsWith("+") ? value.substring(1) : value;

  /**
   * Myanmar local format:
   *
   * 09123456789
   *
   * Remove the first 0 and add 95:
   *
   * 09 123456789
   * ↓
   * 959123456789
   */
  if (withoutPlus.startsWith("09")) {
    return `+${MYANMAR_COUNTRY_CODE}${withoutPlus.substring(1)}`;
  }

  /**
   * Myanmar international format without +:
   *
   * 959123456789
   * ↓
   * +959123456789
   */
  if (withoutPlus.startsWith("959")) {
    return `+${withoutPlus}`;
  }

  /**
   * Already starts with 95.
   *
   * We return it in E.164 format.
   */
  if (withoutPlus.startsWith("95")) {
    return `+${withoutPlus}`;
  }

  /**
   * Unsupported format.
   *
   * Return cleaned value so validation can
   * show the correct error.
   */
  return value;
}

/**
 * ============================================================
 * GET SUBSCRIBER NUMBER
 * ============================================================
 *
 * +959123456789
 *       ↓
 * 9123456789
 */
function getMyanmarSubscriberNumber(phone: string): string {
  const normalized = normalizeMyanmarPhone(phone);

  if (!normalized.startsWith("+95")) {
    return "";
  }

  return normalized.substring(3);
}

/**
 * ============================================================
 * MYANMAR PHONE CHECK
 * ============================================================
 */
export function isMyanmarPhone(phone: string): boolean {
  const normalized = normalizeMyanmarPhone(phone);

  return normalized.startsWith("+95");
}

/**
 * ============================================================
 * MOBILE PREFIX VALIDATION
 * ============================================================
 *
 * Example:
 *
 * +959123456789
 *
 * Subscriber:
 *
 * 9123456789
 *
 * Prefix:
 *
 * 91
 */
export function hasValidMyanmarMobilePrefix(phone: string): boolean {
  const subscriber = getMyanmarSubscriberNumber(phone);

  if (!subscriber.startsWith("9")) {
    return false;
  }

  const prefix = subscriber.substring(0, 2);

  return MYANMAR_MOBILE_PREFIXES.includes(prefix);
}

/**
 * ============================================================
 * PHONE LENGTH VALIDATION
 * ============================================================
 *
 * After +95:
 *
 * +959123456789
 *     ↑
 * subscriber = 9123456789
 *
 * Supported length:
 *
 * 9 or 10 digits
 */
export function hasValidMyanmarPhoneLength(phone: string): boolean {
  const subscriber = getMyanmarSubscriberNumber(phone);

  if (!subscriber) {
    return false;
  }

  return subscriber.length === 9 || subscriber.length === 10;
}

/**
 * ============================================================
 * COMPLETE VALIDATION
 * ============================================================
 */
export function validateMyanmarPhone(phone: string): {
  valid: boolean;
  normalized: string;
  message: string;
} {
  /**
   * Empty input
   */
  if (!phone.trim()) {
    return {
      valid: false,
      normalized: "",
      message: "Phone number is required.",
    };
  }

  /**
   * Normalize first.
   */
  const normalized = normalizeMyanmarPhone(phone);

  /**
   * Must be +95.
   */
  if (!normalized.startsWith("+95")) {
    return {
      valid: false,
      normalized,
      message: "Please enter a valid Myanmar phone number.",
    };
  }

  /**
   * Must be a Myanmar mobile number.
   *
   * +959...
   */
  if (!normalized.startsWith("+959")) {
    return {
      valid: false,
      normalized,
      message: "Please enter a Myanmar mobile number starting with 09.",
    };
  }

  /**
   * Only digits after +.
   */
  if (!/^\+95\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      message: "Phone number contains invalid characters.",
    };
  }

  /**
   * Validate subscriber length.
   */
  if (!hasValidMyanmarPhoneLength(normalized)) {
    return {
      valid: false,
      normalized,
      message: "Please enter a valid Myanmar mobile number.",
    };
  }

  /**
   * Validate mobile prefix.
   */
  if (!hasValidMyanmarMobilePrefix(normalized)) {
    return {
      valid: false,
      normalized,
      message: "The Myanmar mobile number prefix is not valid.",
    };
  }

  return {
    valid: true,
    normalized,
    message: "Valid Myanmar mobile number.",
  };
}
