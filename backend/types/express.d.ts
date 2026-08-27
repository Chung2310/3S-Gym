import type { JwtPayload } from 'jsonwebtoken';
import type { AppLogger } from '../config/logger.js';

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
      log?: AppLogger;
    }
    interface Application {
      frontendReady: Promise<unknown>;
    }
  }
}
