# AI Credit Wallet and Online Top-up Design

**Date:** 2026-08-31
**Status:** Approved
**Branch:** `feat/ai-credit-wallet-payments`

## Goal

Add a credit wallet for every `ADMIN`, `PT`, and `CUSTOMER` account, charge every external AI provider call through a reserve-and-settle workflow, and let users top up credits through VNPay or MoMo. The design must prevent negative balances, duplicate grants, and charges for failed AI calls while keeping a complete financial and AI-usage audit trail.

## Confirmed Product Rules

- Every user role owns an individual wallet. New and existing accounts start with zero credits.
- All external AI calls are billable, including text generation, OCR, image generation, document embedding, and query embedding.
- A request reserves an estimated maximum before calling the provider, settles against actual provider cost when available, and releases the unused reservation.
- A failed or timed-out AI call releases the full reservation.
- Provider calls that do not report cost use a configured fixed fallback charge for their task type.
- Both VNPay and MoMo are supported in the first release.
- Users may buy a configured package or enter a custom VND amount.
- The base conversion is 1,000 VND per credit. Packages may grant bonus credits; custom amounts do not.
- Payment redirect data is display-only. Only a verified server-to-server IPN/webhook may grant credits.
- Refunds to the original payment method are outside this release. Admin credit adjustments remain available as auditable ledger entries.

## Non-goals

- Subscriptions, recurring billing, saved payment methods, coupons, invoices, and tax documents.
- Automated FX feeds or automated OpenRouter price-catalog synchronization.
- Customer-facing AI features that do not exist yet. The billing contract will support them without role-specific changes.
- Deleting or editing finalized wallet ledger entries, paid orders, or finalized AI usage records.

## Architecture

The feature is split into four bounded areas:

1. **Wallet accounting** owns balances, reservations, settlements, releases, top-up grants, and manual adjustments.
2. **AI billing** wraps every provider invocation with a required authenticated billing context and records normalized usage.
3. **Payments** owns top-up orders and delegates gateway-specific signing and response verification to VNPay and MoMo adapters.
4. **Pricing administration** owns VND conversion, the configured USD/VND accounting rate, per-task AI billing policies, and top-up packages.

Controllers remain thin. Mongoose services perform state changes through MongoDB transactions. Gateway adapters contain no wallet logic, and provider adapters contain no direct balance mutations.

## Data Model

### `CreditWallet`

One document per user, enforced by a unique `userId` index.

- `userId: ObjectId` — required reference to `User`.
- `availableCredits: number` — non-negative integer, default `0`.
- `reservedCredits: number` — non-negative integer, default `0`.
- `version: number` — optimistic concurrency counter.
- timestamps.

The invariant is `availableCredits >= 0 && reservedCredits >= 0`. Credits are whole integer units.

### `CreditLedgerEntry`

Append-only record of each wallet mutation.

- `walletId`, `userId`.
- `type`: `TOPUP | RESERVE | SETTLE | RELEASE | ADJUSTMENT`.
- `availableDelta`, `reservedDelta` as signed integers.
- `availableAfter`, `reservedAfter` as non-negative integer snapshots.
- `referenceType`: `AI_USAGE | PAYMENT_ORDER | ADMIN_ADJUSTMENT`.
- `referenceId`.
- `idempotencyKey` with a unique index.
- `reason` required for `ADJUSTMENT`; normalized system description for other types.
- `actorUserId` for manual adjustments and system-initiated operations.
- timestamps; no update or delete application API.

### `AiUsage`

One record per external provider call. One user action may create multiple usage records, such as query embedding followed by assistant text generation.

- `userId`, `walletId`.
- `taskType`: `TEXT_NUTRITION | TEXT_WORKOUT | TEXT_ROADMAP | TEXT_ASSISTANT | TEXT_GENERIC | OCR_INBODY | IMAGE_GENERATION | EMBEDDING_DOCUMENT | EMBEDDING_QUERY`.
- `provider`, `model`.
- `status`: `RESERVED | SUCCEEDED | FAILED | BILLING_SHORTFALL`.
- `requestKey` unique per provider invocation.
- `reservedCredits`, `settledCredits`, `releasedCredits`, `billingShortfall`.
- `inputTokens`, `outputTokens`, `totalTokens` when supplied by the provider.
- `providerCostMicrousd` when supplied by the provider, stored as an integer number of millionths of one USD.
- `pricingSnapshot`: `usdToVnd`, `markupBasisPoints`, `fallbackCredits`, `maxReservationCredits`, and `vndPerCredit`.
- sanitized `failureCode`; provider response bodies and prompts are not stored here.
- timestamps.

### `AiBillingPolicy`

One active document per `taskType`.

- `taskType` unique.
- `enabled`.
- `maxReservationCredits` greater than zero.
- `fallbackCredits` from zero through `maxReservationCredits`.
- `markupBasisPoints`, where `10000` means no markup and `12500` means 25% markup.
- `minBillableCredits`, default `1` for successful non-zero-cost calls.
- timestamps and `updatedById`.

Global pricing contains `vndPerCredit = 1000` and an admin-managed `usdToVnd`. The seed value for `usdToVnd` is `26000`; it is an accounting policy value, not a live exchange-rate quote.

### `CreditPackage`

- `name`, `description`.
- `amountVnd` as an integer from `10000` through `50000000`.
- `baseCredits = floor(amountVnd / 1000)`.
- `bonusCredits` as a non-negative integer.
- `active`, `sortOrder`.
- timestamps and `updatedById`.

### `PaymentOrder`

- `userId`, `walletId`.
- `gateway`: `VNPAY | MOMO`.
- `orderCode` unique and safe for both gateway formats.
- `status`: `PENDING | PAID | FAILED | EXPIRED`.
- `source`: `PACKAGE | CUSTOM` and optional `packageId`.
- `amountVnd`, `baseCredits`, `bonusCredits`, `grantCredits` snapshots.
- `gatewayTransactionId`, unique when present.
- `gatewayResultCode`, `paidAt`, `expiresAt`.
- `grantIdempotencyKey`, unique and derived from the order code.
- timestamps.

The server accepts custom top-ups from `10000` through `50000000` VND in multiples of `1000`. A package must follow the same bounds.

## Wallet Operations

All mutations execute in a MongoDB transaction and create their ledger entry in the same transaction.

### Wallet creation

- Account creation calls `ensureWallet(userId)` after the user is persisted.
- A migration calls the same idempotent operation for every existing user.
- Read paths may call `ensureWallet` as a defensive repair for legacy or partially migrated data.

### Reserve

`reserveCredits({ userId, usageId, amount })` atomically decrements `availableCredits` and increments `reservedCredits` only when `availableCredits >= amount`. Insufficient balance returns a domain error before any provider call.

### Settle

For a successful provider call:

1. Calculate the bill from the immutable pricing snapshot.
2. Consume the required portion of the reservation.
3. Release unused reserved credit to available credit.
4. If the bill exceeds the reservation, atomically collect the delta from available credit when possible.
5. If the delta is larger than the remaining available balance, consume the available balance without going negative and store the remainder as `billingShortfall`.
6. Finalize `AiUsage` and ledger entries in the same transaction.

The normal configuration must set `maxReservationCredits` high enough that step 5 is exceptional.

### Release

Provider failure, timeout, invalid provider output, or cancellation releases the complete reservation and marks the usage `FAILED`. Repeated release calls are idempotent.

### Actual-cost formula

When cost is reported:

```text
rawVnd = providerCostMicrousd * usdToVnd / 1,000,000
markedUpVnd = rawVnd * markupBasisPoints / 10,000
credits = ceil(markedUpVnd / vndPerCredit)
```

For a successful non-zero-cost call, apply `minBillableCredits`. If the provider omits cost, use `fallbackCredits`. The calculation uses integer/decimal-safe arithmetic rather than JavaScript binary floating-point money math.

## AI Provider Integration

Every provider function accepts a required billing context:

```ts
interface AiBillingContext {
  userId: string;
  taskType: AiTaskType;
  requestKey: string;
}
```

`withAiBilling(context, invokeProvider)` performs reserve, provider invocation, normalized usage extraction, settle, and release. Existing service/controller call sites must pass the authenticated actor:

- Nutrition, workout, roadmap, assistant, and legacy text generation.
- InBody and nutrition OCR.
- Image generation.
- Document embedding during an authenticated publish action.
- Query embedding during authenticated vector search.

An operation without an authenticated actor cannot call a billable provider. Startup jobs and migrations must not silently assign charges to an arbitrary user. Future customer AI endpoints use the same context without changes to wallet accounting.

Provider adapters return a normalized result containing content plus optional token and cost metadata. The public response contract continues returning the existing content shape; billing metadata is not exposed unless a feature explicitly requests it.

## Payment Flow

### Order creation

1. Authenticated user chooses `gateway` and either `packageId` or `customAmountVnd`, never both.
2. Server validates the active package or custom-amount rules.
3. Server snapshots amount and credits into a `PENDING` `PaymentOrder` with a 15-minute expiry.
4. The selected gateway adapter creates a signed payment request.
5. API returns the local order ID, expiry, and gateway redirect URL.

Changing pricing or a package after creation never changes a pending order snapshot.

### VNPay

- Build the version 2.1.0 payment URL using sorted parameters and HMAC-SHA512.
- Send `vnp_Amount` as VND multiplied by 100.
- Verify all returned/IPN fields before using them.
- Treat `vnp_ResponseCode = 00` and `vnp_TransactionStatus = 00` as successful only after order code, merchant code, and amount match the local order.
- The GET IPN handler returns the response code/message expected by VNPay.

Reference: <https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html>

### MoMo

- Create a `payWithMethod` request at `/v2/gateway/api/create` using HMAC-SHA256.
- Use unique `requestId` and `orderId` values and include redirect/IPN URLs in the signed request.
- Verify the IPN signature over the documented response fields.
- Treat `resultCode = 0` as successful only after partner code, order code, request ID, and amount match the local order.

Reference: <https://developers.momo.vn/v3/docs/payment/api/collection-link/>

### Webhook settlement

`markOrderPaidAndGrantCredits` runs in one MongoDB transaction:

1. Match the pending local order and exact snapshotted amount.
2. Store the gateway transaction ID and success code.
3. Change the order to `PAID`.
4. Increase wallet available credits by `grantCredits`.
5. Append a `TOPUP` ledger entry using the order grant idempotency key.

Duplicate valid callbacks return success without a second grant. Invalid signatures, mismatched amounts, mismatched owners, or conflicting transaction IDs never mutate wallet state. The browser return route only identifies the local order and lets the frontend poll its server-side state.

## API Surface

Authenticated endpoints for all roles:

- `GET /api/credits/me`
- `GET /api/credits/me/ledger?page=&limit=&type=`
- `GET /api/credits/packages`
- `POST /api/credits/topups`
- `GET /api/credits/topups/:id`

Public gateway callbacks with signature verification and dedicated rate limits:

- `GET /api/credits/webhooks/vnpay`
- `POST /api/credits/webhooks/momo`

Admin-only endpoints:

- `GET/PATCH /api/admin/credit-pricing`
- CRUD under `/api/admin/credit-packages`
- `GET /api/admin/payment-orders`
- `GET /api/admin/ai-usage`
- `GET /api/admin/credit-ledger`
- `POST /api/admin/credit-adjustments`

Admin adjustment payloads contain `userId`, a non-zero signed integer `credits`, an idempotency key, and a required human-readable reason. A debit adjustment is rejected when it would make available credit negative.

## Frontend Experience

### Shared wallet

- Add “Ví credit” navigation for `ADMIN`, `PT`, and `CUSTOMER`.
- Show available credit in the portal header; reserved credit is shown on the wallet detail page.
- `/wallet` provides active packages, a custom amount form, VNPay/MoMo selection, checkout action, and paginated ledger history.
- `/wallet/payment-result` polls the local order until `PAID`, `FAILED`, `EXPIRED`, or a bounded client timeout, then offers a manual refresh.
- AI insufficient-credit responses show a specific message and a link to `/wallet`.
- Refresh the displayed balance after AI settlement and successful payment polling.

### Admin management

- Manage global conversion, USD/VND accounting rate, per-task reservation/fallback/markup policy, and package availability/bonus.
- Inspect payment orders, AI usage, ledger entries, and `BILLING_SHORTFALL` records.
- Apply manual adjustments through a confirmation modal requiring a reason.

The UI reuses the existing `AppShell`, navigation configuration, API client, form/modal primitives, pagination, tables, and toast system. Payment and gateway secrets are never included in frontend configuration or API responses.

## Errors, Security, and Observability

- Add a distinct insufficient-credit error code and return HTTP `402` for a valid request that cannot fund its reservation.
- Gateway-not-configured errors disable only the affected option and return a sanitized service-unavailable response.
- Apply dedicated rate limits to order creation, order polling, and webhooks.
- Redact gateway secrets, signatures, authorization data, prompts, images, and raw provider responses from logs.
- Audit pricing changes, package changes, successful payment grants, rejected webhook anomalies, admin adjustments, and billing shortfalls.
- Retry-safe operations use unique database indexes, not only in-process locks.
- A reconciliation query exposes pending orders past expiry and billing shortfalls to admins. Expired orders are marked on read or by a bounded maintenance operation; a later verified success callback may still settle an expired order only when the gateway transaction is valid and the order has never been paid or failed.

## Configuration

Environment variables hold deploy-specific gateway values:

- VNPay merchant code, hash secret, payment URL, return URL, and IPN URL.
- MoMo partner code, access key, secret key, API URL, redirect URL, and IPN URL.
- Application public URL used to construct safe callbacks.

The application starts when one or both gateway configurations are absent. Its credit APIs report gateway availability, and checkout rejects only the unavailable selection. Pricing and package policy remain database-managed rather than environment-managed.

## Migration and Rollout

1. Create all indexes before enabling payment callbacks.
2. Seed the global pricing document and one policy per current AI task type.
3. Backfill zero-balance wallets for every existing user idempotently.
4. Deploy with gateway options disabled until sandbox credentials and HTTPS callback URLs are configured.
5. Verify signed sandbox payment callbacks and duplicate delivery behavior.
6. Enable gateways independently.
7. Enable AI billing after reservation policies have been reviewed against provider maximums.

## Testing Strategy

### Unit tests

- Integer-safe actual-cost conversion, fallback pricing, rounding, markup, and minimum charge.
- VNPay parameter ordering, HMAC-SHA512 signing, amount scaling, and response verification.
- MoMo request/response HMAC-SHA256 signing and verification.
- Provider usage normalization for present, absent, and malformed usage metadata.

### Service tests

- Wallet creation is idempotent for all roles.
- Reserve, settle, partial release, full release, top-up, and adjustment invariants.
- Concurrent reservations cannot overspend.
- Repeated request keys cannot duplicate ledger entries.
- Settlement over reservation records shortfall without a negative balance.
- Provider failure and timeout release the complete reservation.

### API tests

- Wallet and ledger authorization/ownership.
- Package and custom top-up validation.
- Both gateway order-creation paths.
- Valid, invalid-signature, mismatched-amount, duplicate, expired, and conflicting callback cases.
- Admin authorization, pricing/package validation, and adjustment reason requirements.
- Every current AI route charges the authenticated actor and rejects insufficient credit before calling its provider.

### Frontend tests

- Balance display and shared-role navigation.
- Package/custom checkout and gateway selection.
- Payment-result polling states.
- Ledger filtering/pagination.
- Insufficient-credit call to action.
- Admin pricing, package, audit, and adjustment workflows.

### Completion checks

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Gateway integration tests use deterministic fixtures and mocked HTTP; sandbox smoke tests are documented separately and require merchant credentials.

## Success Criteria

- Every user has one wallet with a zero starting balance unless a verified top-up or auditable adjustment has occurred.
- No AI provider is called when the actor cannot fund the reservation.
- Successful AI calls create exactly one finalized usage record and corresponding ledger effects; failures restore the held balance.
- Valid VNPay and MoMo callbacks grant the snapshotted credits exactly once.
- Tampered, duplicate, or browser-only callback data cannot create credit.
- Users can see their current balance, top up through either configured gateway, and inspect history.
- Admins can manage pricing/packages and reconcile payments, usage, ledger entries, adjustments, and shortfalls.

