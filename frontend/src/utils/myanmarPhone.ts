/**
 * Myanmar phone number utilities
 *
 * Supported input examples:
 *
 * 09xxxxxxxxx
 * 09 xxx xxx xxx
 * 09-xxx-xxx-xxx
 * 959xxxxxxxxx
 * +959xxxxxxxxx
 * +95 9 xxx xxx xxx
 *
 * Output:
 *
 * +959xxxxxxxxx
 */

const MYANMAR_COUNTRY_CODE = "95";

/**
 * Myanmar mobile prefixes.
 *
 * These are used as a numbering-format validation,
 * not as a guaranteed current operator lookup.
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
 * Remove spaces, brackets, hyphens and other
 * common formatting characters.
 */
function cleanPhone(phone: string): string {
  return phone.trim().replace(/[\s\-().]/g, "");
}

/**
 * Convert Myanmar phone number to E.164 format.
 *
 * Examples:
 *
 * 09123456789
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
 */
export function normalizeMyanmarPhone(phone: string): string {
  let value = cleanPhone(phone);

  // Convert international dialing prefix 00
  // 00959123456789 → +959123456789
  if (value.startsWith("00")) {
    value = `+${value.substring(2)}`;
  }

  // Remove leading +
  const withoutPlus = value.startsWith("+") ? value.substring(1) : value;

  // Local Myanmar format:
  // 09123456789 → 959123456789
  if (withoutPlus.startsWith("09")) {
    return `+${MYANMAR_COUNTRY_CODE}${withoutPlus.substring(1)}`;
  }

  // Myanmar international format without +
  // 959123456789 → +959123456789
  if (withoutPlus.startsWith("959")) {
    return `+${withoutPlus}`;
  }

  // Already +95 but invalid local mobile prefix.
  if (withoutPlus.startsWith("95")) {
    return `+${withoutPlus}`;
  }

  return value;
}

/**
 * Check whether the number is a Myanmar number.
 */
export function isMyanmarPhone(phone: string): boolean {
  const normalized = normalizeMyanmarPhone(phone);

  return normalized.startsWith("+95");
}

/**
 * Get the mobile number after +95.
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
 * Check Myanmar mobile prefix.
 *
 * For a number:
 *
 * +959123456789
 *
 * subscriber part:
 *
 * 9123456789
 *
 * mobile prefix:
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
 * Validate Myanmar mobile number length.
 *
 * Myanmar mobile numbers after +95 normally
 * start with 9 and contain 9 or 10 digits
 * depending on the numbering range.
 */
export function hasValidMyanmarPhoneLength(phone: string): boolean {
  const subscriber = getMyanmarSubscriberNumber(phone);

  if (!subscriber) {
    return false;
  }

  return subscriber.length === 9 || subscriber.length === 10;
}

/**
 * Validate the complete Myanmar phone number.
 */
export function validateMyanmarPhone(phone: string): {
  valid: boolean;
  normalized: string;
  message: string;
} {
  if (!phone.trim()) {
    return {
      valid: false,
      normalized: "",
      message: "Phone number is required.",
    };
  }

  const normalized = normalizeMyanmarPhone(phone);

  // Must be +95
  if (!normalized.startsWith("+95")) {
    return {
      valid: false,
      normalized,
      message: "Please enter a valid Myanmar phone number.",
    };
  }

  // Must be +959
  if (!normalized.startsWith("+959")) {
    return {
      valid: false,
      normalized,
      message: "Please enter a Myanmar mobile number starting with 09.",
    };
  }

  // Only digits after +
  if (!/^\+95\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      message: "Phone number contains invalid characters.",
    };
  }

  // Length
  if (!hasValidMyanmarPhoneLength(normalized)) {
    return {
      valid: false,
      normalized,
      message: "Please enter a valid Myanmar mobile number.",
    };
  }

  // Prefix
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
