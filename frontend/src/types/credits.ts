import type { PaginationMeta } from '../types';

export type PaymentGateway = 'VNPAY' | 'MOMO';
export interface CreditWallet { id: string; availableCredits: number; reservedCredits: number }
export interface CreditPackage { id: string; name: string; description: string; amountVnd: number; baseCredits: number; bonusCredits: number; grantCredits: number; active?: boolean; sortOrder?: number }
export interface CreditLedgerEntry { _id: string; type: 'TOPUP' | 'RESERVE' | 'SETTLE' | 'RELEASE' | 'ADJUSTMENT'; availableDelta: number; reservedDelta: number; availableAfter: number; reservedAfter: number; reason: string; createdAt: string }
export interface PaymentOrder { id: string; orderCode: string; gateway: PaymentGateway; status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'; source: 'PACKAGE' | 'CUSTOM'; amountVnd: number; baseCredits: number; bonusCredits: number; grantCredits: number; expiresAt: string; redirectUrl?: string }
export interface GatewayAvailability { VNPAY: boolean; MOMO: boolean }
export interface CreditPackageResponse { packages: CreditPackage[]; gateways: GatewayAvailability }
export interface CreditPricingPolicy { taskType: string; enabled: boolean; maxReservationCredits: number; fallbackCredits: number; markupBasisPoints: number; minBillableCredits: number }
export interface CreditPricingAdmin { vndPerCredit: number; usdToVnd: number; policies: CreditPricingPolicy[] }
export interface PaginatedCredits<T> { items: T[]; meta?: PaginationMeta }
