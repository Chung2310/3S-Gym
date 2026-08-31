# AI Credit Wallet and Online Top-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every admin, PT, and customer an auditable credit wallet, charge all AI/embedding work through reserve-and-settle billing, and support idempotent VNPay and MoMo top-ups.

**Architecture:** Build an append-only wallet ledger over atomic MongoDB transactions, then place a billing coordinator around provider calls. Payment orders snapshot their credit grant and are settled only by verified gateway callbacks through isolated VNPay/MoMo adapters. Shared wallet UI consumes authenticated credit APIs, while admin UI manages policies, packages, reconciliation, and adjustments.

**Tech Stack:** TypeScript 7, Express 5, Mongoose 9/MongoDB transactions, Joi, React 19, React Router 7, Vitest 4, Testing Library, Node `crypto` and `fetch`.

## Global Constraints

- Every `ADMIN`, `PT`, and `CUSTOMER` account owns an individual wallet and starts with zero credits.
- The base conversion is exactly `1,000 VND = 1 credit`; custom top-ups grant no bonus.
- All current text, OCR, image, document-embedding, and query-embedding operations are billable.
- Reserve before work, settle against actual provider cost when present, use the task fallback when absent, and release the full reservation on failure.
- Never allow `availableCredits` or `reservedCredits` to become negative.
- Only verified server-to-server callbacks grant credits; browser redirects are display-only.
- Both VNPay and MoMo ship in this release, but either may be independently unavailable when its environment configuration is absent.
- Credits, VND, basis points, micro-USD, token counts, and monetary calculations use integers or integer-safe arithmetic.
- Ledger entries, paid orders, and finalized usage records are append-only from the application API.
- Gateway secrets, signatures, prompts, images, and raw provider responses are never logged or returned to the frontend.
- No subscriptions, recurring billing, saved payment methods, coupons, invoices, automated FX feeds, gateway refunds, or live provider price synchronization.
- Do not add a third-party payment SDK; use Node `crypto`, `URLSearchParams`, and the existing timeout-aware fetch helper.

---

## File Structure

### Backend domain

- `backend/models/CreditWallet.ts` — cached wallet balances and invariants.
- `backend/models/CreditLedgerEntry.ts` — immutable balance-change journal.
- `backend/models/AiUsage.ts` — one normalized record per billable operation.
- `backend/models/AiBillingPolicy.ts` — per-task reservation/fallback/markup policy.
- `backend/models/CreditPricing.ts` — singleton VND/credit and USD/VND policy.
- `backend/models/CreditPackage.ts` — admin-managed top-up offers.
- `backend/models/PaymentOrder.ts` — immutable payment snapshot and settlement state.
- `backend/services/creditPricingService.ts` — integer-safe bill calculation and pricing reads.
- `backend/services/creditWalletService.ts` — wallet mutation primitives and ledger queries.
- `backend/services/aiBillingService.ts` — reserve/invoke/settle/release coordinator.
- `backend/services/vnpayGateway.ts` and `backend/services/momoGateway.ts` — signing and verification only.
- `backend/services/paymentService.ts` — order creation, callback settlement, and user order reads.
- `backend/services/creditAdminService.ts` — pricing/package/usage/payment/adjustment administration.
- `backend/validators/creditValidator.ts`, `backend/controllers/creditController.ts`, `backend/controllers/creditAdminController.ts`, `backend/routes/credits.ts`, and `backend/routes/adminCredits.ts` — HTTP boundary.

### Frontend domain

- `frontend/src/types/credits.ts` — wallet, package, order, ledger, usage, and pricing contracts.
- `frontend/src/services/credits.ts` — typed endpoint calls and checkout helpers.
- `frontend/src/contexts/CreditWalletContext.tsx` — shared balance loading/refresh.
- `frontend/src/pages/common/WalletPage.tsx` — balance, checkout, and history.
- `frontend/src/pages/common/PaymentResultPage.tsx` — bounded order polling.
- `frontend/src/pages/admin/CreditAdminPage.tsx` — pricing, packages, reconciliation, and adjustments.
- `frontend/src/components/credits/` — focused package, custom amount, ledger, and admin panels.

---

### Task 1: Credit models and integer-safe pricing

**Files:**
- Create: `backend/models/CreditWallet.ts`
- Create: `backend/models/CreditLedgerEntry.ts`
- Create: `backend/models/AiUsage.ts`
- Create: `backend/models/AiBillingPolicy.ts`
- Create: `backend/models/CreditPricing.ts`
- Create: `backend/models/CreditPackage.ts`
- Create: `backend/models/PaymentOrder.ts`
- Create: `backend/services/creditTypes.ts`
- Create: `backend/services/creditPricingService.ts`
- Create: `backend/tests/creditPricing.test.ts`
- Create: `backend/tests/creditModels.test.ts`

**Interfaces:**
- Produces: `AiTaskType`, `AiBillingContext`, `ProviderUsage`, `PricingSnapshot`, `calculateSettledCredits(usage, snapshot): number`, and all seven Mongoose models.
- Consumes: no feature code.

- [ ] **Step 1: Write failing pricing tests**

```ts
import { describe, expect, it } from 'vitest';
import { calculateSettledCredits } from '../services/creditPricingService.js';

const pricing = { usdToVnd: 26000, vndPerCredit: 1000, markupBasisPoints: 12500, fallbackCredits: 3, minBillableCredits: 1, maxReservationCredits: 20 };

describe('calculateSettledCredits', () => {
  it('converts micro-USD with markup and rounds up to whole credits', () => {
    expect(calculateSettledCredits({ providerCostMicrousd: 100_000 }, pricing)).toBe(4);
  });
  it('uses fallback when the provider omits cost', () => {
    expect(calculateSettledCredits({}, pricing)).toBe(3);
  });
  it('caps settlement at no less than the configured minimum for non-zero cost', () => {
    expect(calculateSettledCredits({ providerCostMicrousd: 1 }, pricing)).toBe(1);
  });
});
```

- [ ] **Step 2: Run RED tests**

Run: `npm test -- backend/tests/creditPricing.test.ts backend/tests/creditModels.test.ts`

Expected: FAIL because the credit models and pricing service do not exist.

- [ ] **Step 3: Define shared billing types and model invariants**

```ts
export const AI_TASK_TYPES = ['TEXT_NUTRITION', 'TEXT_WORKOUT', 'TEXT_ROADMAP', 'TEXT_ASSISTANT', 'TEXT_GENERIC', 'OCR_INBODY', 'IMAGE_GENERATION', 'EMBEDDING_DOCUMENT', 'EMBEDDING_QUERY'] as const;
export type AiTaskType = typeof AI_TASK_TYPES[number];
export interface AiBillingContext { userId: string; taskType: AiTaskType; requestKey: string }
export interface ProviderUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; providerCostMicrousd?: number }
export interface PricingSnapshot { usdToVnd: number; vndPerCredit: number; markupBasisPoints: number; fallbackCredits: number; minBillableCredits: number; maxReservationCredits: number }
```

Implement schemas exactly as the approved design specifies, including unique indexes on wallet user, ledger idempotency key, usage request key, active task policy, payment order code, optional gateway transaction ID, and grant idempotency key. Add schema validators requiring non-negative integer balances and credits.

- [ ] **Step 4: Implement integer-safe pricing**

```ts
export function calculateSettledCredits(usage: ProviderUsage, pricing: PricingSnapshot): number {
  if (usage.providerCostMicrousd === undefined) return pricing.fallbackCredits;
  if (usage.providerCostMicrousd === 0) return 0;
  const numerator = BigInt(usage.providerCostMicrousd) * BigInt(pricing.usdToVnd) * BigInt(pricing.markupBasisPoints);
  const denominator = 1_000_000n * 10_000n * BigInt(pricing.vndPerCredit);
  const rounded = Number((numerator + denominator - 1n) / denominator);
  return Math.max(pricing.minBillableCredits, rounded);
}
```

Also implement `getPricingSnapshot(taskType)` so it reads the singleton pricing and enabled task policy and returns a plain immutable snapshot.

- [ ] **Step 5: Run GREEN tests and model index checks**

Run: `npm test -- backend/tests/creditPricing.test.ts backend/tests/creditModels.test.ts`

Expected: PASS with rounding, fallback, validation, and unique-index assertions green.

- [ ] **Step 6: Commit**

```bash
git add backend/models/CreditWallet.ts backend/models/CreditLedgerEntry.ts backend/models/AiUsage.ts backend/models/AiBillingPolicy.ts backend/models/CreditPricing.ts backend/models/CreditPackage.ts backend/models/PaymentOrder.ts backend/services/creditTypes.ts backend/services/creditPricingService.ts backend/tests/creditPricing.test.ts backend/tests/creditModels.test.ts
git commit -m "feat(credits): add wallet and billing domain models"
```

### Task 2: Atomic wallet accounting and wallet creation

**Files:**
- Create: `backend/services/creditWalletService.ts`
- Create: `backend/tests/creditWalletService.test.ts`
- Modify: `backend/services/userService.ts`
- Modify: `backend/tests/auth.test.ts`
- Modify: `backend/errors/errorCodes.ts`

**Interfaces:**
- Consumes: Task 1 models and `PricingSnapshot`.
- Produces: `ensureWallet`, `getWalletSummary`, `reserveCredits`, `settleCredits`, `releaseCredits`, `grantTopupCredits`, `adjustCredits`, and `listLedger`. Every mutation accepts an optional `ClientSession`; without one it opens a transaction, and with one it joins the caller's transaction.

- [ ] **Step 1: Write failing transaction tests**

Use `MongoMemoryReplSet` and assert:

```ts
const wallet = await ensureWallet(user.id);
await grantTopupCredits({ userId: user.id, paymentOrderId: order.id, credits: 10, idempotencyKey: 'grant:order-1' });
await reserveCredits({ userId: user.id, usageId: usage.id, credits: 6, idempotencyKey: 'reserve:usage-1' });
await settleCredits({ userId: user.id, usageId: usage.id, reservedCredits: 6, settledCredits: 4 });
expect(await CreditWallet.findOne({ userId: user.id })).toMatchObject({ availableCredits: 6, reservedCredits: 0 });
expect(await CreditLedgerEntry.countDocuments({ userId: user.id })).toBe(4);
```

Add separate tests for insufficient balance returning HTTP-domain status `402`/code `INSUFFICIENT_CREDITS`, concurrent reservations allowing only one winner, complete release, duplicate idempotency keys, settlement shortfall, and adjustment debit rejection.

- [ ] **Step 2: Run RED wallet tests**

Run: `npm test -- backend/tests/creditWalletService.test.ts backend/tests/auth.test.ts`

Expected: FAIL because accounting functions and wallet creation are missing.

- [ ] **Step 3: Implement conditional wallet mutations**

Use `withTransaction` and conditional `findOneAndUpdate` filters. Reservation must use this shape:

```ts
const wallet = await CreditWallet.findOneAndUpdate(
  { userId, availableCredits: { $gte: credits } },
  { $inc: { availableCredits: -credits, reservedCredits: credits, version: 1 } },
  { session, returnDocument: 'after' },
);
if (!wallet) throw new AppError({ status: 402, code: ERROR_CODES.INSUFFICIENT_CREDITS, message: 'Số dư credit không đủ. Vui lòng nạp thêm credit.' });
```

Each mutation creates ledger entries with after-snapshots in the same transaction. Implement a private `inTransaction(session, work)` helper so AI usage creation and payment settlement can atomically join wallet mutations without nested sessions. Catch duplicate-key errors only to return the already-applied result for the exact same reference/idempotency key; never convert unrelated database failures into success.

- [ ] **Step 4: Create wallets with accounts**

Wrap production `createUser` persistence and `ensureWallet` in `User.db.transaction`. Ensure an existing bootstrap admin gets a wallet. Customer account creation already calls `createUser`, so it inherits the same behavior. Add `INSUFFICIENT_CREDITS` to `ERROR_CODES`.

- [ ] **Step 5: Run GREEN wallet and account tests**

Run: `npm test -- backend/tests/creditWalletService.test.ts backend/tests/auth.test.ts backend/tests/customers.test.ts`

Expected: PASS; admin, PT, and customer accounts each receive exactly one zero wallet.

- [ ] **Step 6: Commit**

```bash
git add backend/services/creditWalletService.ts backend/services/userService.ts backend/errors/errorCodes.ts backend/tests/creditWalletService.test.ts backend/tests/auth.test.ts
git commit -m "feat(credits): add atomic wallet accounting"
```

### Task 3: Wallet backfill and pricing seeds

**Files:**
- Modify: `backend/services/migrationService.ts`
- Modify: `backend/tests/migrationSeed.test.ts`
- Modify: `backend/tests/migrationConcurrency.test.ts`

**Interfaces:**
- Consumes: `ensureWallet`, credit models, and `AI_TASK_TYPES`.
- Produces: migration `002-credit-wallets-and-pricing` and idempotent reference seeds.

- [ ] **Step 1: Write failing migration tests**

Create users for all three roles, run migrations twice, and assert one wallet per user, singleton pricing `{ key: 'GLOBAL', vndPerCredit: 1000, usdToVnd: 26000 }`, one policy per task type, and no duplicate records under concurrent migration runners.

- [ ] **Step 2: Run RED migration tests**

Run: `npm test -- backend/tests/migrationSeed.test.ts backend/tests/migrationConcurrency.test.ts`

Expected: FAIL because migration 002 and credit seeds do not exist.

- [ ] **Step 3: Generalize migration runner without rewriting migration 001 history**

Represent migrations as ordered definitions:

```ts
interface MigrationDefinition { version: string; name: string; up: () => Promise<Record<string, unknown>>; down: (metadata: Record<string, unknown>) => Promise<void> }
const migrations: MigrationDefinition[] = [contentDefaultsMigration, creditWalletMigration];
```

Migration 002 records created wallet IDs and seeded IDs for rollback, calls `ensureWallet` for every existing user, and uses `$setOnInsert` for global pricing and policies. `seedReferenceData` also repairs missing credit policies idempotently.

- [ ] **Step 4: Run GREEN migration tests**

Run: `npm test -- backend/tests/migrationSeed.test.ts backend/tests/migrationConcurrency.test.ts backend/tests/opsScripts.test.ts`

Expected: PASS with ordered, retry-safe migrations.

- [ ] **Step 5: Commit**

```bash
git add backend/services/migrationService.ts backend/tests/migrationSeed.test.ts backend/tests/migrationConcurrency.test.ts
git commit -m "feat(credits): backfill wallets and billing policies"
```

### Task 4: VNPay and MoMo gateway adapters

**Files:**
- Modify: `backend/config/env.ts`
- Modify: `.env.example`
- Create: `backend/services/vnpayGateway.ts`
- Create: `backend/services/momoGateway.ts`
- Create: `backend/tests/vnpayGateway.test.ts`
- Create: `backend/tests/momoGateway.test.ts`
- Modify: `backend/tests/environment.test.ts`

**Interfaces:**
- Produces: `GatewayCreateInput`, `GatewayPaymentResult`, `createVnpayPayment`, `verifyVnpayCallback`, `createMomoPayment`, `verifyMomoCallback`, and gateway availability flags.
- Consumes: `fetchWithTimeout` for MoMo HTTP creation and `AppEnv` payment configuration.

- [ ] **Step 1: Write official-fixture signature tests**

Assert VNPay sorted query/HMAC-SHA512, `amountVnd * 100`, callback verification, and constant-time signature comparison. Assert MoMo raw signing strings, HMAC-SHA256 request/response verification, create response parsing, and unavailable configuration behavior. Tests must include tampered amount and signature cases.

- [ ] **Step 2: Run RED gateway tests**

Run: `npm test -- backend/tests/vnpayGateway.test.ts backend/tests/momoGateway.test.ts backend/tests/environment.test.ts`

Expected: FAIL because adapters and environment fields are missing.

- [ ] **Step 3: Add optional environment configuration**

Add trimmed optional values for:

```text
APP_URL
VNPAY_TMN_CODE
VNPAY_HASH_SECRET
VNPAY_PAYMENT_URL
VNPAY_RETURN_URL
VNPAY_IPN_URL
MOMO_PARTNER_CODE
MOMO_ACCESS_KEY
MOMO_SECRET_KEY
MOMO_API_URL
MOMO_REDIRECT_URL
MOMO_IPN_URL
```

Configuration is optional at startup. An adapter reports `configured: false` unless all fields required by that gateway are present.

- [ ] **Step 4: Implement pure signing/verification and MoMo creation**

For VNPay, exclude `vnp_SecureHash` and `vnp_SecureHashType`, sort keys, encode with `URLSearchParams`, and sign with `createHmac('sha512', secret)`. For MoMo, construct the exact documented field order and sign with SHA256. Compare decoded signature buffers only when lengths match.

- [ ] **Step 5: Run GREEN gateway tests**

Run: `npm test -- backend/tests/vnpayGateway.test.ts backend/tests/momoGateway.test.ts backend/tests/environment.test.ts backend/tests/providerTimeout.test.ts`

Expected: PASS with no network calls outside mocked MoMo creation.

- [ ] **Step 6: Commit**

```bash
git add backend/config/env.ts .env.example backend/services/vnpayGateway.ts backend/services/momoGateway.ts backend/tests/vnpayGateway.test.ts backend/tests/momoGateway.test.ts backend/tests/environment.test.ts
git commit -m "feat(payments): add VNPay and MoMo adapters"
```

### Task 5: User top-up APIs and idempotent webhook settlement

**Files:**
- Create: `backend/services/paymentService.ts`
- Create: `backend/validators/creditValidator.ts`
- Create: `backend/controllers/creditController.ts`
- Create: `backend/routes/credits.ts`
- Modify: `backend/app.ts`
- Create: `backend/tests/creditPaymentsApi.test.ts`
- Modify: `backend/tests/routeValidation.test.ts`

**Interfaces:**
- Produces authenticated `/api/credits/*` endpoints and public gateway callbacks.
- Consumes gateway adapters, `grantTopupCredits`, credit packages, pricing, and payment orders.

- [ ] **Step 1: Write failing API tests**

Cover all roles for `GET /api/credits/me`, ledger ownership, active packages, package/custom order creation, custom bounds/multiples, unavailable gateway, foreign order denial, VNPay and MoMo success, bad signature, wrong amount, duplicate callback, gateway transaction conflict, failure callback, and late valid success for an unpaid expired order.

- [ ] **Step 2: Run RED payment API tests**

Run: `npm test -- backend/tests/creditPaymentsApi.test.ts backend/tests/routeValidation.test.ts`

Expected: FAIL with route-not-found.

- [ ] **Step 3: Implement order creation and reads**

Validate exactly one of `packageId` or `customAmountVnd`:

```ts
const topupBody = Joi.object({
  gateway: Joi.string().valid('VNPAY', 'MOMO').required(),
  packageId: objectId,
  customAmountVnd: Joi.number().integer().min(10_000).max(50_000_000).multiple(1_000),
}).xor('packageId', 'customAmountVnd');
```

Create a unique alphanumeric order code, a 15-minute expiry, and immutable amount/credit snapshots before asking the adapter for a redirect URL. Return only local order ID/code, status, expiry, grant credits, redirect URL, and gateway availability.

- [ ] **Step 4: Implement verified callback settlement**

Verify gateway signature first, then match gateway/order/request/merchant identifiers and exact amount. In one MongoDB transaction update only an unpaid order, store transaction metadata, call `grantTopupCredits` with `payment:<orderCode>`, and create an audit entry. Return gateway-specific acknowledgement on duplicates without granting again.

- [ ] **Step 5: Mount routes with dedicated limits**

Mount `/api/credits` once in `backend/app.ts`. Authenticate all user endpoints; leave only `/webhooks/vnpay` and `/webhooks/momo` unauthenticated. Apply separate limiters to create, poll, and callback routes.

- [ ] **Step 6: Run GREEN payment API tests**

Run: `npm test -- backend/tests/creditPaymentsApi.test.ts backend/tests/routeValidation.test.ts backend/tests/securityHardening.test.ts`

Expected: PASS and duplicate callbacks leave exactly one `TOPUP` ledger entry.

- [ ] **Step 7: Commit**

```bash
git add backend/services/paymentService.ts backend/validators/creditValidator.ts backend/controllers/creditController.ts backend/routes/credits.ts backend/app.ts backend/tests/creditPaymentsApi.test.ts backend/tests/routeValidation.test.ts
git commit -m "feat(payments): add credit top-up APIs"
```

### Task 6: AI billing coordinator and provider usage normalization

**Files:**
- Create: `backend/services/aiBillingService.ts`
- Modify: `backend/services/aiProvider.ts`
- Modify: `backend/services/ocrProvider.ts`
- Modify: `backend/services/imageProvider.ts`
- Modify: `backend/services/embeddingProvider.ts`
- Create: `backend/tests/aiBillingService.test.ts`
- Modify: `backend/tests/providerContract.test.ts`
- Modify: `backend/tests/imageProvider.test.ts`
- Modify: `backend/tests/vectorSearchProvider.test.ts`

**Interfaces:**
- Produces: `withAiBilling<T>(context, invoke): Promise<T>` and `ProviderResult<T> { value: T; usage: ProviderUsage; provider: string; model: string }`. Public provider entry points become `generateText(context, prompt)`, specialized text variants with the same leading context, `extractInBody(context, file)`, `generateImage(context, options)`, and `embedTextBillable(context, value)`.
- Consumes Task 1 pricing and Task 2 wallet operations.

- [ ] **Step 1: Write failing RED/GREEN coordinator scenarios**

```ts
await expect(withAiBilling(context, async () => ({ value: 'ok', provider: 'openrouter', model: 'm', usage: { providerCostMicrousd: 100_000 } }))).resolves.toBe('ok');
expect(await AiUsage.findOne({ requestKey: context.requestKey })).toMatchObject({ status: 'SUCCEEDED', reservedCredits: 20, settledCredits: 4, releasedCredits: 16 });

await expect(withAiBilling(failingContext, async () => { throw new Error('timeout'); })).rejects.toThrow('timeout');
expect(await CreditWallet.findOne({ userId })).toMatchObject({ availableCredits: 20, reservedCredits: 0 });
```

Also test fallback cost, disabled policy, insufficient credit before invocation, repeated request key, invalid provider output, and billing shortfall.

- [ ] **Step 2: Run RED coordinator/provider tests**

Run: `npm test -- backend/tests/aiBillingService.test.ts backend/tests/providerContract.test.ts backend/tests/imageProvider.test.ts backend/tests/vectorSearchProvider.test.ts`

Expected: FAIL because normalized provider results and billing coordinator are absent.

- [ ] **Step 3: Implement reserve/invoke/settle/release**

`withAiBilling` creates `AiUsage` in `RESERVED` and reserves the snapshotted maximum in one transaction, invokes once, then calculates settlement and finalizes usage/wallet in one transaction. It releases and finalizes failure state in one transaction on every thrown error. A repeated finalized request key returns a conflict rather than calling the provider twice; it never replays generated content from the usage record.

- [ ] **Step 4: Normalize provider metadata**

Text and OCR OpenRouter response types must read `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`, and `usage.cost`. Convert USD cost with `Math.round(cost * 1_000_000)` after validating it is finite and non-negative. Image generation already reports cost/tokens and must return them in `ProviderResult`. Keep the pure synchronous `embedText(value)` for vector fixture construction and cosine-search internals; add `embedTextBillable(context, value)` for every application document/query embedding so its configured fallback policy applies.

Preserve public convenience functions by returning `result.value`; expose internal raw functions to `withAiBilling` rather than leaking provider metadata to controllers.

- [ ] **Step 5: Run GREEN coordinator/provider tests**

Run: `npm test -- backend/tests/aiBillingService.test.ts backend/tests/providerContract.test.ts backend/tests/imageProvider.test.ts backend/tests/vectorSearchProvider.test.ts`

Expected: PASS with balances restored on every provider failure.

- [ ] **Step 6: Commit**

```bash
git add backend/services/aiBillingService.ts backend/services/aiProvider.ts backend/services/ocrProvider.ts backend/services/imageProvider.ts backend/services/embeddingProvider.ts backend/tests/aiBillingService.test.ts backend/tests/providerContract.test.ts backend/tests/imageProvider.test.ts backend/tests/vectorSearchProvider.test.ts
git commit -m "feat(credits): meter AI provider usage"
```

### Task 7: Route every current AI and embedding operation through billing

**Files:**
- Modify: `backend/services/contentDraftService.ts`
- Modify: `backend/services/assistantService.ts`
- Modify: `backend/services/aiWorkoutService.ts`
- Modify: `backend/services/inbodyOcrService.ts`
- Modify: `backend/services/nutritionScanService.ts`
- Modify: `backend/services/knowledgeService.ts`
- Modify: `backend/services/vectorSearchProvider.ts`
- Modify: `backend/controllers/imageController.ts`
- Modify: `backend/controllers/legacyNutritionController.ts`
- Modify: `backend/controllers/knowledgeAssistantController.ts`
- Modify: `backend/tests/contentDrafts.test.ts`
- Modify: `backend/tests/inbodyOcr.test.ts`
- Modify: `backend/tests/knowledgeAssistant.test.ts`
- Modify: `backend/tests/knowledgeCrudConversation.test.ts`
- Modify: `backend/tests/aiWorkoutApi.test.ts`
- Modify: `backend/tests/aiWorkoutService.test.ts`
- Modify: `backend/tests/nutritionLegacyContract.test.ts`
- Modify: `backend/tests/vectorRag.test.ts`
- Create: `backend/tests/aiCreditIntegration.test.ts`

**Interfaces:**
- Consumes: `withAiBilling`, authenticated user, request ID.
- Produces: no unbilled current AI operation.

- [ ] **Step 1: Write failing integration coverage**

Create a table-driven test that funds an actor wallet, invokes every current AI route/service with mocked provider responses, and asserts the expected `AiUsage.taskType`. Add a zero-wallet case for each provider family and assert the provider mock was not called. Add a multi-call assistant case asserting query embedding and assistant text create separate usages.

- [ ] **Step 2: Run RED integration tests**

Run: `npm test -- backend/tests/aiCreditIntegration.test.ts backend/tests/contentDrafts.test.ts backend/tests/inbodyOcr.test.ts backend/tests/knowledgeAssistant.test.ts backend/tests/aiWorkoutApi.test.ts`

Expected: FAIL because existing calls do not pass billing context.

- [ ] **Step 3: Pass explicit billing context at service boundaries**

Derive stable request keys from `req.requestId` plus a suffix for each provider call, for example `requestId:embedding-query` and `requestId:text-assistant`. Pass `AuthenticatedUser`, not only a raw role, through knowledge search/index and legacy nutrition paths. Do not invent a system actor for `seedStandardKnowledgeLibrary`; reject billable indexing without an authenticated user and keep non-provider database seeding separate.

- [ ] **Step 4: Update existing mocks to the new provider contract**

Provider mocks return normalized `ProviderResult` internally or mock `withAiBilling` at the coordinator boundary. Each modified test must still assert the feature's original content behavior in addition to new billing assertions.

- [ ] **Step 5: Run GREEN integration and regression tests**

Run: `npm test -- backend/tests/aiCreditIntegration.test.ts backend/tests/contentDrafts.test.ts backend/tests/inbodyOcr.test.ts backend/tests/knowledgeAssistant.test.ts backend/tests/knowledgeCrudConversation.test.ts backend/tests/aiWorkoutApi.test.ts backend/tests/aiWorkoutService.test.ts backend/tests/nutritionLegacyContract.test.ts backend/tests/vectorRag.test.ts`

Expected: PASS; every billed success settles once and every failure releases once.

- [ ] **Step 6: Commit**

```bash
git add backend/services/contentDraftService.ts backend/services/assistantService.ts backend/services/aiWorkoutService.ts backend/services/inbodyOcrService.ts backend/services/nutritionScanService.ts backend/services/knowledgeService.ts backend/services/vectorSearchProvider.ts backend/controllers/imageController.ts backend/controllers/legacyNutritionController.ts backend/controllers/knowledgeAssistantController.ts backend/tests
git commit -m "feat(credits): charge all AI operations"
```

### Task 8: Admin pricing, package, reconciliation, and adjustment APIs

**Files:**
- Create: `backend/services/creditAdminService.ts`
- Create: `backend/controllers/creditAdminController.ts`
- Create: `backend/routes/adminCredits.ts`
- Modify: `backend/validators/creditValidator.ts`
- Modify: `backend/app.ts`
- Modify: `backend/services/auditService.ts`
- Create: `backend/tests/creditAdminApi.test.ts`

**Interfaces:**
- Produces admin endpoints from the spec and audit metadata for pricing, package, adjustment, rejected callback, and shortfall events.
- Consumes all credit models and wallet adjustment primitive.

- [ ] **Step 1: Write failing admin API tests**

Assert PT/customer receive 403. Assert admin can read/update singleton pricing, update every task policy, CRUD packages, paginate payment/usage/ledger filters, list shortfalls, and create positive/negative adjustments. Assert zero adjustment, missing reason, invalid package credit math, and debit below zero are rejected.

- [ ] **Step 2: Run RED admin tests**

Run: `npm test -- backend/tests/creditAdminApi.test.ts backend/tests/auditMatrix.test.ts`

Expected: FAIL with route-not-found.

- [ ] **Step 3: Implement validated admin services/routes**

Use `PATCH /api/admin/credit-pricing` for the singleton plus an array of complete per-task policy updates. Package creates/updates recompute `baseCredits` server-side from `amountVnd`; clients cannot submit it. List endpoints whitelist sortable/filterable fields and cap page size at 100.

- [ ] **Step 4: Expand safe audit metadata**

Allow only explicit non-secret keys: `credits`, `amountVnd`, `gateway`, `taskType`, `billingShortfall`, `reasonCode`, and `version`. Never store signatures, credentials, raw callback bodies, prompts, or images.

- [ ] **Step 5: Run GREEN admin tests**

Run: `npm test -- backend/tests/creditAdminApi.test.ts backend/tests/auditMatrix.test.ts backend/tests/sensitiveMutationAudit.test.ts`

Expected: PASS with one audit record per accepted admin mutation.

- [ ] **Step 6: Commit**

```bash
git add backend/services/creditAdminService.ts backend/controllers/creditAdminController.ts backend/routes/adminCredits.ts backend/validators/creditValidator.ts backend/app.ts backend/services/auditService.ts backend/tests/creditAdminApi.test.ts
git commit -m "feat(credits): add credit administration APIs"
```

### Task 9: Shared frontend credit state, balance header, and routes

**Files:**
- Create: `frontend/src/types/credits.ts`
- Modify: `frontend/src/types.ts`
- Create: `frontend/src/services/credits.ts`
- Create: `frontend/src/contexts/CreditWalletContext.tsx`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/tests/components/AppShell.test.tsx`
- Modify: `frontend/src/config/portalNavigation.test.ts`
- Create: `frontend/tests/services/credits.test.ts`
- Create: `frontend/tests/contexts/CreditWalletContext.test.tsx`

**Interfaces:**
- Produces: `useCreditWallet(): { wallet, loading, refresh }`, shared `/wallet` navigation, and a mutation refresh event.
- Consumes: `GET /api/credits/me` and typed credit service calls.

- [ ] **Step 1: Write failing state/navigation/header tests**

Assert all three roles see a “Ví credit” link to `/wallet`, the header renders `25 credit`, context loads once, a successful POST/PATCH dispatch causes one debounced refresh, and a failed request does not fake a balance change.

- [ ] **Step 2: Run RED frontend state tests**

Run: `npm test -- frontend/tests/services/credits.test.ts frontend/tests/contexts/CreditWalletContext.test.tsx frontend/tests/components/AppShell.test.tsx frontend/src/config/portalNavigation.test.ts`

Expected: FAIL because shared credit types/context/navigation are absent.

- [ ] **Step 3: Implement typed services and provider**

```ts
export interface CreditWalletSummary { availableCredits: number; reservedCredits: number; gatewayAvailability: { VNPAY: boolean; MOMO: boolean } }
export const CREDIT_REFRESH_EVENT = '3s:credits:refresh';
```

After every successful API request except `GET /api/credits/me` and wallet-ledger polling, `api.ts` dispatches `CREDIT_REFRESH_EVENT` in browser environments. This also covers the billable `GET /api/knowledge/search` path. The context listens, debounces concurrent refreshes, and exposes a manual `refresh`. Wrap `PortalContent` with `CreditWalletProvider` and let `AppShell` consume the context.

- [ ] **Step 4: Add shared navigation and routes**

Add `{ path: '/wallet', label: 'Ví credit', section: 'Tài khoản', icon: WalletCards, roles: ['ADMIN', 'PT', 'CUSTOMER'], matchChildren: true }`. Register `/wallet` and `/wallet/payment-result` before role wildcard routes.

- [ ] **Step 5: Run GREEN frontend state tests**

Run: `npm test -- frontend/tests/services/credits.test.ts frontend/tests/contexts/CreditWalletContext.test.tsx frontend/tests/components/AppShell.test.tsx frontend/src/config/portalNavigation.test.ts`

Expected: PASS with no role-specific wallet branching.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/credits.ts frontend/src/types.ts frontend/src/services/credits.ts frontend/src/contexts/CreditWalletContext.tsx frontend/src/services/api.ts frontend/src/config/portalNavigation.ts frontend/src/routes/PortalRoutes.tsx frontend/src/components/AppShell.tsx frontend/tests/components/AppShell.test.tsx frontend/src/config/portalNavigation.test.ts frontend/tests/services/credits.test.ts frontend/tests/contexts/CreditWalletContext.test.tsx
git commit -m "feat(credits): expose shared wallet balance"
```

### Task 10: Wallet checkout, ledger, and payment-result UI

**Files:**
- Create: `frontend/src/pages/common/WalletPage.tsx`
- Create: `frontend/src/pages/common/PaymentResultPage.tsx`
- Create: `frontend/src/components/credits/CreditPackageGrid.tsx`
- Create: `frontend/src/components/credits/CustomTopupForm.tsx`
- Create: `frontend/src/components/credits/CreditLedgerTable.tsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/tests/pages/WalletPage.test.tsx`
- Create: `frontend/tests/pages/PaymentResultPage.test.tsx`

**Interfaces:**
- Consumes typed credit services/context.
- Produces complete self-service top-up and history experience.

- [ ] **Step 1: Write failing wallet-page behavior tests**

Assert package and custom amount are mutually exclusive, custom validation is 10,000–50,000,000 VND in 1,000 increments, unavailable gateways are disabled, checkout redirects only to an `https:` URL returned by the API, loading prevents duplicate submit, and ledger pagination/filtering preserves ownership.

- [ ] **Step 2: Write failing payment-result polling tests**

With fake timers, assert immediate local status read, polling while `PENDING`, stop on `PAID`/`FAILED`/`EXPIRED`, stop after 60 seconds with manual refresh, refresh context after `PAID`, and never infer success from gateway query parameters.

- [ ] **Step 3: Run RED page tests**

Run: `npm test -- frontend/tests/pages/WalletPage.test.tsx frontend/tests/pages/PaymentResultPage.test.tsx`

Expected: FAIL because pages/components do not exist.

- [ ] **Step 4: Implement wallet page with existing UI primitives**

Use semantic radio controls for package/gateway choices, `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`, existing pagination/toast components, accessible status text, and no gateway secrets. Submit `{ gateway, packageId }` or `{ gateway, customAmountVnd }`, then assign `window.location.href = redirectUrl` only after validating the URL protocol is HTTPS (HTTP allowed only for localhost development).

- [ ] **Step 5: Implement bounded result polling**

Read only the local `orderId` query parameter. Poll `GET /api/credits/topups/:id` every 2 seconds for at most 60 seconds, cancel timers on unmount, and render explicit terminal states plus a link back to `/wallet`.

- [ ] **Step 6: Run GREEN page tests**

Run: `npm test -- frontend/tests/pages/WalletPage.test.tsx frontend/tests/pages/PaymentResultPage.test.tsx`

Expected: PASS with accessible package, amount, gateway, loading, and result states.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/common/WalletPage.tsx frontend/src/pages/common/PaymentResultPage.tsx frontend/src/components/credits frontend/src/index.css frontend/tests/pages/WalletPage.test.tsx frontend/tests/pages/PaymentResultPage.test.tsx
git commit -m "feat(credits): add wallet top-up experience"
```

### Task 11: Admin credit UI and insufficient-credit call to action

**Files:**
- Create: `frontend/src/pages/admin/CreditAdminPage.tsx`
- Create: `frontend/src/components/credits/CreditPricingPanel.tsx`
- Create: `frontend/src/components/credits/CreditPackageAdmin.tsx`
- Create: `frontend/src/components/credits/CreditReconciliationTabs.tsx`
- Create: `frontend/src/components/credits/CreditAdjustmentModal.tsx`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/components/workouts/AiWorkoutWizard.tsx`
- Modify: `frontend/src/components/inbody/InBodyScanModal.tsx`
- Modify: `frontend/src/components/nutrition/AiNutritionDraftModal.tsx`
- Modify: `frontend/src/components/nutrition/NutritionMacroCalculator.tsx`
- Modify: `frontend/src/components/nutrition/MealPlannerBuilder.tsx`
- Modify: `frontend/src/components/roadmap/RoadmapForm.tsx`
- Modify: `frontend/src/components/knowledge/KnowledgeSearch.tsx`
- Modify: `frontend/src/pages/admin/AdminKnowledgePage.tsx`
- Modify: `frontend/src/pages/pt/PtAssistantPage.tsx`
- Modify: `frontend/src/pages/ConsultationTool.tsx`
- Create: `frontend/tests/pages/CreditAdminPage.test.tsx`
- Create: `frontend/tests/services/insufficientCredits.test.ts`

**Interfaces:**
- Consumes admin credit APIs and `ApiError.code`.
- Produces admin configuration/reconciliation screens and a shared insufficient-credit UX.

- [ ] **Step 1: Write failing admin-page tests**

Assert pricing values and every task policy load, invalid fallback-over-reservation is blocked, package credit totals are server-derived, tables filter payments/usages/ledger/shortfalls, and an adjustment requires a signed non-zero amount plus reason and confirmation.

- [ ] **Step 2: Write failing insufficient-credit mapping test**

```ts
expect(creditErrorAction(new ApiError('Số dư credit không đủ.', 402, 'INSUFFICIENT_CREDITS'))).toEqual({ message: 'Số dư credit không đủ.', href: '/wallet', label: 'Nạp credit' });
```

Assert unrelated 402/provider errors do not become wallet errors.

- [ ] **Step 3: Run RED admin/error tests**

Run: `npm test -- frontend/tests/pages/CreditAdminPage.test.tsx frontend/tests/services/insufficientCredits.test.ts`

Expected: FAIL because admin page and shared mapper are absent.

- [ ] **Step 4: Implement admin panels and route**

Add `/admin/credits` and an admin-only “Quản lý credit” navigation item. Keep pricing, packages, reconciliation, and adjustments as separate focused components. Use existing modal, table, pagination, and toast patterns; never allow direct balance editing in a table cell.

- [ ] **Step 5: Centralize insufficient-credit UX**

Export `creditErrorAction(error)` from `frontend/src/services/credits.ts`. Update each AI-triggering component to show the server message plus a real `/wallet` link when and only when `code === 'INSUFFICIENT_CREDITS'`. Remove OpenRouter-account top-up copy from user-facing error handling because wallet funding is now the actionable path.

- [ ] **Step 6: Run GREEN admin/error tests and the complete existing page/component suites**

Run: `npm test -- frontend/tests/pages/CreditAdminPage.test.tsx frontend/tests/services/insufficientCredits.test.ts frontend/tests/pages frontend/tests/components`

Expected: PASS and existing AI workflows retain their original success behavior.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/admin/CreditAdminPage.tsx frontend/src/components/credits frontend/src/routes/PortalRoutes.tsx frontend/src/config/portalNavigation.ts frontend/src/services/api.ts frontend/src/services/credits.ts frontend/src/components frontend/tests/pages/CreditAdminPage.test.tsx frontend/tests/services/insufficientCredits.test.ts
git commit -m "feat(credits): add credit administration UI"
```

### Task 12: Documentation and full verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Create: `docs/operations/credit-payments.md`

**Interfaces:**
- Produces deployment/runbook documentation and verified release evidence.
- Consumes the complete feature.

- [ ] **Step 1: Document configuration and operations**

Document sandbox/production endpoint separation, HTTPS IPN requirements, how to register both callback URLs, gateway-independent enablement, initial pricing review, migration/seed commands, duplicate callback expectations, order/shortfall reconciliation, secret rotation, and the fact that redirect data never grants credit.

- [ ] **Step 2: Run focused backend verification**

Run: `npm run test:backend`

Expected: all backend test files pass with zero failures.

- [ ] **Step 3: Run complete test suite**

Run: `npm test`

Expected: all backend and frontend test files pass with zero failures.

- [ ] **Step 4: Run static and production verification**

Run: `npm run typecheck && npm run lint && npm run build`

Expected: exit code 0 for every command, with no new errors or warnings attributable to this feature.

- [ ] **Step 5: Inspect release diff and security-sensitive strings**

Run: `git diff --check && rg -n "VNPAY_HASH_SECRET|MOMO_SECRET_KEY|MOMO_ACCESS_KEY" backend frontend --glob '!backend/config/env.ts'`

Expected: `git diff --check` emits no errors; secret names appear only in approved environment/configuration code and never as literal credentials or frontend fields.

- [ ] **Step 6: Commit documentation and any test-proven verification fixes**

```bash
git add README.md .env.example docs/operations/credit-payments.md
git commit -m "docs: add credit payment operations guide"
```

- [ ] **Step 7: Record final evidence**

Capture exact counts from the final `npm test`, the successful typecheck/lint/build commands, the worktree path, branch, and final commit list for handoff. Do not claim production payment success without separate credentialed sandbox evidence.
