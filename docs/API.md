# API contract

Base: `/api/v1`. JSON only. Online features are independent of the reader. **Only the health endpoint is implemented in Sprint 1; the contracts below are planned.**

## Implemented

`GET /api/v1/health` executes a PostgreSQL connectivity check and returns `200 {"data":{"status":"ok"},"meta":{"request_id":"..."}}`. Database unavailability returns 503 with the error envelope. `/up` is Rails process liveness only.

## Planned endpoints

| Method/path               | Authentication                   | Input/output                                                                                                                           |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| POST /installations       | Rate-limited public registration | Returns installation ID and one-time opaque bearer credential; store digest only                                                       |
| POST /guide/explain       | Installation bearer + quota      | verse_ref, language en/hi, depth simple/advanced; explanation, practical_application, references, generated_by_ai=true, cache metadata |
| POST /guide/ask           | Installation bearer + quota      | question (bounded), optional verse_ref, language; answer, references, generated_by_ai=true, request_id                                 |
| GET /content/manifest     | Public, cacheable                | Latest compatible version, schema_version, HTTPS asset URL, SHA-256, size_bytes, published_at                                          |
| GET /entitlements         | Installation bearer              | Verified entitlements, expiration and verification time                                                                                |
| POST /webhooks/revenuecat | Secret webhook authorization     | Validate payload, unique provider event ID, process idempotently                                                                       |

All table paths are relative to `/api/v1`. Bearer credentials never appear in URLs or logs. Public registration needs abuse controls beyond per-device limits. Manifest clients supply supported schema/app compatibility; return a clear no-compatible-release result rather than an unsupported database.

## Envelopes

Success: `{ "data": { ... }, "meta": { "request_id": "..." } }`.

Error: `{ "error": { "code": "invalid_input", "message": "...", "details": {} }, "meta": { "request_id": "..." } }`.

Use 400 malformed JSON, 401 missing/invalid auth, 403 entitlement denial, 404 unknown resource/reference, 422 semantic validation, 429 quota/rate limit with Retry-After, 502 invalid provider response and 503 temporary unavailability. Do not send provider traces to clients. Authentication and content reference validation precede expensive AI calls. Server validates returned citations against retrieved source refs.

## AI policy

Prompt context distinguishes canonical text, reviewed commentary and user input. Treat retrieved/user text as data, use a bounded provider timeout, validate structured output and never expose model chain-of-thought. No fabricated Sanskrit quotation. Cite the approved text, acknowledge interpretive differences, label AI output. Cost/token accounting is persisted for successful and failed requests when available. General cached explanations include content release, language, depth, model and prompt version in the cache key.
