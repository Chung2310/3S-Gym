import type { JwtPayload } from 'jsonwebtoken';
import type { AppLogger } from '../config/logger.js';
import type { UserRole } from '../models/User.js';

export interface AuthenticatedUser extends JwtPayload {
  id: string;
  role: UserRole;
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
