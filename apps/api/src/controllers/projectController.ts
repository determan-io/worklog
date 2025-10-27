import { Request, Response } from 'express';
import { prisma } from '../index';

export class ProjectController {
  // Get projects
  async getProjects(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const { 
        customer_id, 
        status,
        is_active,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        organization_id: req.user.organizationId
      };

      // Role-based access control
      // Employees can only see active projects they're assigned to
      // Admins and managers can see all projects in their organization
      if (req.user.role === 'employee') {
        console.log('🔒 Employee access - filtering by active project memberships');
        
        const userMemberships = await prisma.projectMembership.findMany({
          where: {
            user_id: req.user.id,
            is_active: true
          },
          select: {
            project_id: true
          }
        });

        const userProjectIds = userMemberships.map(m => m.project_id);
        if (userProjectIds.length > 0) {
          where.id = {
            in: userProjectIds
          };
          // Employees can only see active projects
          where.is_active = true;
        } else {
          // Employee has no memberships, return empty array
          where.id = {
            in: []
          };
        }
      } else {
        console.log('✅ Admin/Manager access - showing all organization projects');
      }

      if (customer_id) {
        where.customer_id = customer_id as string;
      }

      if (status) {
        where.status = status as string;
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: {
            created_at: 'desc'
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            sow: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            time_entries: {
              take: 100, // Limit for performance
              orderBy: {
                entry_date: 'desc'
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    is_active: true
                  }
                }
              }
            },
            _count: {
              select: {
                time_entries: true
              }
            }
          }
        }),
        prisma.project.count({ where })
      ]);

      res.json({
        data: projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        message: 'Projects retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch projects'
        }
      });
    }
  }

  // Get project details
  async getProject(req: Request, res: Response) {
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

      // Role-based access control
      // Employees can only see active projects they're assigned to
      if (req.user.role === 'employee') {
        const membership = await prisma.projectMembership.findFirst({
          where: {
            project_id: id,
            user_id: req.user.id,
            is_active: true
          }
        });

        if (!membership) {
          console.log('🔒 Employee attempted to access project without membership - blocked');
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have access to this project'
            }
          });
        }
      }

      const project = await prisma.project.findFirst({
        where: {
          id,
          organization_id: req.user.organizationId
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true
            }
          },
          sow: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                start_date: true,
                end_date: true,
                hourly_rate: true
              }
          },
          time_entries: {
            take: 10,
            orderBy: {
              entry_date: 'desc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          },
          memberships: {
            select: {
              id: true,
              uuid: true,
              hourly_rate: true,
              is_active: true,
              user: {
                select: {
                  uuid: true,
                  email: true,
                  first_name: true,
                  last_name: true,
                  is_active: true
                }
              }
            }
          },
          _count: {
            select: {
              time_entries: true
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found or access denied'
          }
        });
      }

      // Employees can only access active projects
      if (req.user.role === 'employee' && !project.is_active) {
        console.log('🔒 Employee attempted to access inactive project - blocked');
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access active projects'
          }
        });
      }

      res.json({
        data: project,
        message: 'Project retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch project'
        }
      });
    }
  }

  // Create project
  async createProject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      // Only admins and managers can create projects
      if (req.user.role === 'employee') {
        console.log('🔒 Employee attempted to create project - blocked');
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators and managers can create projects'
          }
        });
      }

      const {
        name,
        description,
        customer_id,
        sow_id,
        status = 'active',
        is_active = true,
        start_date,
        end_date,
        hourly_rate,
        budget_hours
      } = req.body;

      // Validate required fields
      if (!name || !customer_id) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'name and customer_id are required'
          }
        });
      }

      // Verify customer belongs to user's organization
      const customer = await prisma.customer.findFirst({
        where: {
          id: customer_id,
          organization_id: req.user.organizationId
        }
      });

      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found or access denied'
          }
        });
      }

      const project = await prisma.project.create({
        data: {
          organization_id: req.user.organizationId,
          customer_id,
          sow_id: sow_id || null,
          name,
          description: description || null,
          status,
          is_active,
          billing_model: 'timesheet', // Default billing model
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
          budget_hours: budget_hours ? parseInt(budget_hours) : null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          sow: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      });

      res.status(201).json({
        data: project,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create project'
        }
      });
    }
  }

  // Update project
  async updateProject(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      // Only admins and managers can update projects
      if (req.user.role === 'employee') {
        console.log('🔒 Employee attempted to update project - blocked');
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators and managers can update projects'
          }
        });
      }

      const { id } = req.params;
      const { 
        name, 
        description, 
        customer_id, 
        sow_id,
        billing_model,
        status,
        is_active,
        start_date,
        end_date,
        hourly_rate,
        budget_hours
      } = req.body;

      console.log('📝 Update project request:', { id, name, customer_id, billing_model, body: req.body });

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Project name is required'
          }
        });
      }

      // Check if project exists and belongs to user's organization
      const existingProject = await prisma.project.findFirst({
        where: {
          id,
          organization_id: req.user.organizationId
        }
      });

      if (!existingProject) {
        return res.status(404).json({
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found'
          }
        });
      }

        // Update project
        const project = await prisma.project.update({
          where: { id },
          data: {
            name,
            description: description || null,
            customer_id,
            sow_id: sow_id || null,
            billing_model: billing_model || existingProject.billing_model,
            status: status || existingProject.status,
            is_active: is_active !== undefined ? is_active : existingProject.is_active,
            start_date: start_date ? new Date(start_date) : existingProject.start_date,
            end_date: end_date ? new Date(end_date) : existingProject.end_date,
            hourly_rate: hourly_rate ? parseFloat(hourly_rate) : existingProject.hourly_rate,
            budget_hours: budget_hours ? parseInt(budget_hours) : existingProject.budget_hours
          },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          sow: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          _count: {
            select: {
              time_entries: true
            }
          }
        }
      });

      res.json({
        data: project,
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update project'
        }
      });
    }
  }
}
