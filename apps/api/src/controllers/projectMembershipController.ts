import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectMembershipController {
  // Get all members of a project
  async getProjectMembers(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      const members = await prisma.projectMembership.findMany({
        where: {
          project_id: projectId,
          is_active: true
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true
            }
          }
        },
        orderBy: {
          joined_at: 'desc'
        }
      });

      return res.json({
        data: members
      });
    } catch (error) {
      console.error('Error fetching project members:', error);
      return res.status(500).json({
        error: {
          code: 'FETCH_MEMBERS_ERROR',
          message: 'Failed to fetch project members'
        }
      });
    }
  }

  // Get all projects for a user
  async getUserProjects(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const memberships = await prisma.projectMembership.findMany({
        where: {
          user_id: parseInt(userId),
          is_active: true
        },
        include: {
          project: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          joined_at: 'desc'
        }
      });

      return res.json({
        data: memberships
      });
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return res.status(500).json({
        error: {
          code: 'FETCH_PROJECTS_ERROR',
          message: 'Failed to fetch user projects'
        }
      });
    }
  }

  // Add a user to a project
  async addMember(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { user_id, role, hourly_rate } = req.body;

      // Validate required fields
      if (!user_id || !role) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'user_id and role are required'
          }
        });
      }

      // Check if membership already exists
      const existingMembership = await prisma.projectMembership.findUnique({
        where: {
          project_id_user_id: {
            project_id: projectId,
            user_id: parseInt(user_id)
          }
        }
      });

      if (existingMembership) {
        // If exists but inactive, reactivate it
        if (!existingMembership.is_active) {
          const updatedMembership = await prisma.projectMembership.update({
            where: {
              id: existingMembership.id
            },
            data: {
              is_active: true,
              role,
              hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
              left_at: null
            },
            include: {
              user: {
                select: {
                  id: true,
                  uuid: true,
                  email: true,
                  first_name: true,
                  last_name: true,
                  role: true
                }
              }
            }
          });

          return res.json({
            data: updatedMembership,
            message: 'User re-added to project'
          });
        }

        return res.status(400).json({
          error: {
            code: 'MEMBERSHIP_EXISTS',
            message: 'User is already a member of this project'
          }
        });
      }

      // Create new membership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          organization: {
            select: {
              id: true
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found'
          }
        });
      }

      const membership = await prisma.projectMembership.create({
        data: {
          organization_id: project.organization.id,
          project_id: projectId,
          user_id: parseInt(user_id),
          role,
          hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true
            }
          }
        }
      });

      return res.status(201).json({
        data: membership
      });
    } catch (error) {
      console.error('Error adding project member:', error);
      return res.status(500).json({
        error: {
          code: 'ADD_MEMBER_ERROR',
          message: 'Failed to add member to project'
        }
      });
    }
  }

  // Update project membership
  async updateMember(req: Request, res: Response) {
    try {
      const { membershipId } = req.params;
      const { role, hourly_rate, is_active } = req.body;

      // Try to find by UUID first, then by ID if it fails
      let membership = await prisma.projectMembership.findUnique({
        where: { uuid: membershipId }
      });

      if (!membership) {
        // Fallback to numeric ID for backwards compatibility
        membership = await prisma.projectMembership.findUnique({
          where: { id: parseInt(membershipId) }
        });
      }

      if (!membership) {
        return res.status(404).json({
          error: {
            code: 'MEMBERSHIP_NOT_FOUND',
            message: 'Membership not found'
          }
        });
      }

      const updatedMembership = await prisma.projectMembership.update({
        where: { id: membership.id },
        data: {
          role: role !== undefined ? role : membership.role,
          hourly_rate: hourly_rate !== undefined ? parseFloat(hourly_rate) : membership.hourly_rate,
          is_active: is_active !== undefined ? is_active : membership.is_active
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true
            }
          }
        }
      });

      return res.json({
        data: updatedMembership
      });
    } catch (error) {
      console.error('Error updating project member:', error);
      return res.status(500).json({
        error: {
          code: 'UPDATE_MEMBER_ERROR',
          message: 'Failed to update project member'
        }
      });
    }
  }

  // Remove a user from a project
  async removeMember(req: Request, res: Response) {
    try {
      const { membershipId } = req.params;

      // Try to find by UUID first, then by ID if it fails
      let membership = await prisma.projectMembership.findUnique({
        where: { uuid: membershipId }
      });

      if (!membership) {
        // Fallback to numeric ID for backwards compatibility
        membership = await prisma.projectMembership.findUnique({
          where: { id: parseInt(membershipId) }
        });
      }

      if (!membership) {
        return res.status(404).json({
          error: {
            code: 'MEMBERSHIP_NOT_FOUND',
            message: 'Membership not found'
          }
        });
      }

      // Soft delete by setting is_active to false
      const updatedMembership = await prisma.projectMembership.update({
        where: { id: membership.id },
        data: {
          is_active: false,
          left_at: new Date()
        }
      });

      return res.json({
        data: updatedMembership,
        message: 'Member removed from project'
      });
    } catch (error) {
      console.error('Error removing project member:', error);
      return res.status(500).json({
        error: {
          code: 'REMOVE_MEMBER_ERROR',
          message: 'Failed to remove member from project'
        }
      });
    }
  }
}

export default new ProjectMembershipController();

