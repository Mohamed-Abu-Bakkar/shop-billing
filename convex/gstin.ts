import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * GSTIN verification via the gstinapi.in REST API.
 *
 * Server-side only: the API key is read from the `GSTIN_API_KEY` Convex
 * environment variable (`npx convex env set GSTIN_API_KEY <key>`) and is
 * never exposed to the client.
 *
 * Response notes:
 * - Only the principal place of business is returned (additional places of
 *   business are not covered by this endpoint).
 * - `city` is recorded by the GST network as the registered address locality;
 *   it can itself contain comma-separated parts (e.g. "Saidapet, Chennai").
 * - `business_constitution`, `state_jurisdiction` and `nature_of_business`
 *   are always null from this provider; they are intentionally not exposed.
 */

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const BASE_URL = "https://www.gstinapi.in/v1/gstin";
const MAX_ATTEMPTS = 3;

export type GstinRecord = {
  gstin: string;
  legalName: string;
  tradeName: string;
  status: string;
  taxpayerType: string;
  registrationDate: string | null;
  cancellationDate: string | null;
  stateCode: string | null;
  address: string;
  city: string;
  pincode: string | null;
  blockStatus: string | null;
};

export type GstinLookupResult =
  | { ok: true; data: GstinRecord; creditsRemaining: number | null }
  | { ok: false; error: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function asRecord(input: unknown): Record<string, unknown> | null {
  return input !== null && typeof input === "object"
    ? (input as Record<string, unknown>)
    : null;
}

function asOptionalString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function asString(input: unknown, fallback = ""): string {
  return typeof input === "string" ? input : fallback;
}

async function fetchGstin(gstin: string, apiKey: string) {
  // Retry only 429 (rate limit) and 502 (provider temporarily unavailable),
  // with exponential backoff. All other status codes are terminal.
  let attempt = 0;
  for (;;) {
    attempt += 1;
    const res = await fetch(`${BASE_URL}/${gstin}`, {
      headers: { "x-api-key": apiKey },
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if ((res.status === 429 || res.status === 502) && attempt < MAX_ATTEMPTS) {
      const delay = 2 ** attempt * 500;
      console.log(`[GSTIN] status ${res.status}, retrying in ${delay}ms (attempt ${attempt})`);
      await sleep(delay);
      continue;
    }

    return { status: res.status, json: asRecord(json) };
  }
}

const gstinRecordValidator = v.object({
  gstin: v.string(),
  legalName: v.string(),
  tradeName: v.string(),
  status: v.string(),
  taxpayerType: v.string(),
  registrationDate: v.union(v.string(), v.null()),
  cancellationDate: v.union(v.string(), v.null()),
  stateCode: v.union(v.string(), v.null()),
  address: v.string(),
  city: v.string(),
  pincode: v.union(v.string(), v.null()),
  blockStatus: v.union(v.string(), v.null()),
});

const lookupResultValidator = v.union(
  v.object({
    ok: v.literal(true),
    data: gstinRecordValidator,
    creditsRemaining: v.union(v.number(), v.null()),
  }),
  v.object({
    ok: v.literal(false),
    error: v.string(),
  }),
);

export const lookupGstin = action({
  args: { gstin: v.string() },
  returns: lookupResultValidator,
  handler: async (_ctx, { gstin }): Promise<GstinLookupResult> => {
    // Validate format client-side-style before spending a request.
    const normalized = gstin.trim().toUpperCase();
    if (!GSTIN_REGEX.test(normalized)) {
      return {
        ok: false,
        error: "Invalid GSTIN format. Expected 15 characters: 2 digit state code, 5 letters, 4 PAN digits, 1 PAN letter, 1 alphanumeric, Z, then 1 alphanumeric.",
      };
    }

    const apiKey = process.env.GSTIN_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "GSTIN_API_KEY is not configured. Set it with `npx convex env set GSTIN_API_KEY <key>`.",
      };
    }

    const { status, json } = await fetchGstin(normalized, apiKey);

    // Watch the account balance on every call.
    const creditsRemaining =
      typeof json?.credits_remaining === "number" ? json.credits_remaining : null;
    if (creditsRemaining !== null) {
      console.log(`[GSTIN] credits_remaining=${creditsRemaining}`);
    }

    if (status === 200) {
      const data = asRecord(json?.data);
      if (!data || typeof data.gstin !== "string") {
        return { ok: false, error: "Unexpected response from the GSTIN service." };
      }
      const record: GstinRecord = {
        gstin: data.gstin,
        legalName: asString(data.legal_name),
        tradeName: asString(data.trade_name) || asString(data.legal_name),
        status: asString(data.status, "Unknown"),
        taxpayerType: asString(data.taxpayer_type),
        registrationDate: asOptionalString(data.registration_date),
        cancellationDate: asOptionalString(data.cancellation_date),
        stateCode: asOptionalString(data.state_code),
        address: asString(data.address),
        city: asString(data.city),
        pincode: asOptionalString(data.pincode),
        blockStatus: asOptionalString(data.block_status),
      };
      return { ok: true, data: record, creditsRemaining };
    }

    switch (status) {
      case 400:
        return { ok: false, error: "The GSTIN format is invalid. Please check and try again." };
      case 401:
        return { ok: false, error: "GSTIN API authentication failed. Check the server API key." };
      case 402:
        return { ok: false, error: "The GSTIN API credits are exhausted. Please top up your account." };
      case 403:
        return { ok: false, error: "The GSTIN API account is deactivated. Contact gstinapi.in for support." };
      case 404:
        return { ok: false, error: "This GSTIN is not registered in the GST database." };
      case 429:
        return { ok: false, error: "Too many GSTIN lookups. Please try again in a minute." };
      case 502:
        return { ok: false, error: "The GSTIN service is temporarily unavailable. Please try again shortly." };
      default: {
        const serviceError = asOptionalString(json?.error);
        return {
          ok: false,
          error: serviceError ?? `GSTIN lookup failed with status code ${status}.`,
        };
      }
    }
  },
});