import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Development authentication bypass
export const devAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    // Get the first organization from the database for development
    const organization = await prisma.organization.findFirst({
      select: { uuid: true }
    });

    if (!organization) {
      return res.status(500).json({
        error: {
          code: 'NO_ORGANIZATION',
          message: 'No organization found in database'
        }
      });
    }

    // Get a specific user from the database for development (employee user)
    const user = await prisma.user.findFirst({
      where: {
        email: 'employee@worklog-dev.com'
      },
      select: { id: true, email: true, role: true, keycloak_id: true }
    });

    if (!user) {
      return res.status(500).json({
        error: {
          code: 'NO_USER',
          message: 'No user found in database'
        }
      });
    }

    // For development, use real user data
    req.user = {
      id: user.id.toString(),
      email: user.email,
      organizationId: organization.uuid,
      role: user.role,
      keycloakId: user.keycloak_id
    };
    return next();
  }
  
  // In production, require real authentication
  return res.status(401).json({
    error: {
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required'
    }
  });
};
