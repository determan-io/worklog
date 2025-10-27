import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        uuid: string;
        email: string;
        organizationId: string;
        role: string;
        keycloakId: string;
      };
    }
  }
}

interface KeycloakToken {
  sub: string;
  email: string;
  preferred_username: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 Authentication middleware called for:', req.path);
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Access token is required'
        }
      });
    }

    console.log('✅ Token received, decoding...');
    
    // Verify Keycloak JWT token
    // Keycloak tokens are signed by Keycloak's certificate
    // For now, we'll decode without verification (should use Keycloak's public key in production)
    const decoded = jwt.decode(token) as KeycloakToken;
    
    console.log('📋 Decoded token:', {
      sub: decoded?.sub,
      email: decoded?.email,
      preferred_username: decoded?.preferred_username,
      roles: decoded?.realm_access?.roles
    });
    
    if (!decoded) {
      console.log('❌ Failed to decode token');
      throw new Error('Invalid token');
    }
    
    console.log(`🔍 Looking up user in database with keycloak_id: ${decoded.sub}`);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        keycloak_id: decoded.sub
      },
      include: {
        organization: true
      }
    });

    console.log('👤 Database user lookup result:', user ? {
      id: user.id,
      email: user.email,
      keycloak_id: user.keycloak_id,
      organization: user.organization?.name,
      is_active: user.is_active
    } : 'NOT FOUND');

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database'
        }
      });
    }

    if (!user.is_active) {
      console.log('❌ User is inactive');
      return res.status(403).json({
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }

    if (!user.organization) {
      console.log('❌ User has no organization assigned');
      return res.status(403).json({
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User is not assigned to any organization'
        }
      });
    }

    console.log('✅ Authentication successful:', {
      id: user.id,
      email: user.email,
      organization: user.organization.name,
      role: user.role
    });

    // Attach user to request (only UUID, never expose internal database ID)
    req.user = {
      id: user.id, // Keep internal ID for database queries only
      uuid: user.uuid,
      email: user.email,
      organizationId: user.organization.uuid,
      role: user.role,
      keycloakId: user.keycloak_id
    } as any;

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required roles: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
};

export const requireOrganization = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    });
  }

  // Check if user belongs to the organization in the request
  const organizationId = req.params.organizationId || req.body.organizationId;
  
  if (organizationId && req.user.organizationId !== organizationId) {
    return res.status(403).json({
      error: {
        code: 'ORGANIZATION_ACCESS_DENIED',
        message: 'Access denied to this organization'
      }
    });
  }

  next();
};
