import { Request, Response } from 'express';
import { prisma } from '../index';

export class OrganizationController {
  // Get user's organizations
  async getUserOrganizations(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const organizations = await prisma.organization.findMany({
        where: {
          uuid: req.user.organizationId
        },
        select: {
          id: true,
          name: true,
          domain: true,
          settings: true,
          subscription_plan: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      res.json({
        data: organizations,
        message: 'Organizations retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch organizations'
        }
      });
    }
  }

  // Get organization details
  async getOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      // Check if user belongs to this organization
      if (req.user.organizationId !== id) {
        return res.status(403).json({
          error: {
            code: 'ORGANIZATION_ACCESS_DENIED',
            message: 'Access denied to this organization'
          }
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { uuid: id },
        select: {
          id: true,
          name: true,
          domain: true,
          settings: true,
          subscription_plan: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              users: true,
              customers: true,
              projects: true,
              time_entries: true
            }
          }
        }
      });

      if (!organization) {
        return res.status(404).json({
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        });
      }

      res.json({
        data: organization,
        message: 'Organization retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch organization'
        }
      });
    }
  }

  // Update organization
  async updateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, domain, settings, subscription_plan } = req.body;

      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      // Check if user belongs to this organization and has admin role
      if (req.user.organizationId !== id || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin or manager role required'
          }
        });
      }

      const updatedOrganization = await prisma.organization.update({
        where: { uuid: id },
        data: {
          ...(name && { name }),
          ...(domain && { domain }),
          ...(settings && { settings }),
          ...(subscription_plan && { subscription_plan })
        },
        select: {
          id: true,
          name: true,
          domain: true,
          settings: true,
          subscription_plan: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      res.json({
        data: updatedOrganization,
        message: 'Organization updated successfully'
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update organization'
        }
      });
    }
  }
}
