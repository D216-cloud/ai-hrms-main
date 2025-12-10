import { NextResponse } from "next/server";
import * as dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // Test 1: DNS Resolution
    console.log("Test 1: DNS Resolution...");
    try {
      const mphzAddress = await dnsLookup("mphzqewnvtkcaswydjmn.supabase.co");
      results.tests.dns = {
        status: "OK",
        address: mphzAddress.address,
        family: mphzAddress.family,
      };
    } catch (e) {
      results.tests.dns = {
        status: "FAILED",
        error: e.message,
      };
    }

    // Test 2: Direct HTTPS Fetch
    console.log("Test 2: HTTPS Fetch to Supabase...");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        "https://mphzqewnvtkcaswydjmn.supabase.co/rest/v1/",
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeout);
      results.tests.https = {
        status: "OK",
        statusCode: response.status,
        statusText: response.statusText,
      };
    } catch (e) {
      results.tests.https = {
        status: "FAILED",
        error: e.message,
        code: e.code,
      };
    }

    // Test 3: Environment Variables
    console.log("Test 3: Environment Variables...");
    results.tests.env = {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 60) + "...",
    };

    // Test 4: Node version and platform
    results.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    return NextResponse.json(results);
  } catch (error) {
    results.error = error.message;
    return NextResponse.json(results, { status: 500 });
  }
}
