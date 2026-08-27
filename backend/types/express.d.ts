import type { JwtPayload } from 'jsonwebtoken';
import type { Logger } from 'pino';

export interface AuthenticatedUser extends JwtPayload {
  id: string;
  role: 'ADMIN' | 'PT' | 'CUSTOMER';
  username?: string;
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      log?: Logger;
    }
    interface Application {
      frontendReady: Promise<unknown>;
    }
  }
}
