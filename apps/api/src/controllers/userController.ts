import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserController {
  // Get users in the authenticated user's organization
  async getUsers(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      console.log('🔍 Fetching users for organization:', req.user.organizationId);

      // First, get the organization by UUID
      const organization = await prisma.organization.findUnique({
        where: { uuid: req.user.organizationId }
      });

      if (!organization) {
        console.log('❌ Organization not found:', req.user.organizationId);
        return res.json({
          data: [],
          message: 'Users retrieved successfully'
        });
      }

      console.log('✅ Organization found:', organization.name);

      const users = await prisma.user.findMany({
        where: {
          organization_id: organization.id
        },
        select: {
          id: true,
          uuid: true,
          keycloak_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log(`✅ Found ${users.length} users for organization ${organization.name}`);

      res.json({
        data: users,
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch users'
        }
      });
    }
  }

  // Get user details by ID
  async getUserById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const { id } = req.params;

      const user = await prisma.user.findFirst({
        where: {
          id: parseInt(id),
          organization_id: parseInt(req.user.organizationId)
        },
        select: {
          id: true,
          uuid: true,
          keycloak_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found or access denied'
          }
        });
      }

      res.json({
        data: user,
        message: 'User retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user'
        }
      });
    }
  }
}

