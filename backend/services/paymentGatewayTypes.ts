export interface GatewayCreateInput {
  orderCode: string;
  requestId?: string;
  amountVnd: number;
  description: string;
  ipAddress?: string;
  createdAt?: Date;
}

export type GatewayPaymentResult =
  | { configured: false }
  | { configured: true; redirectUrl: string };

export interface GatewayCallbackResult {
  valid: boolean;
  orderCode?: string;
  amountVnd?: number;
  transactionId?: string;
  resultCode?: string;
  success?: boolean;
}
