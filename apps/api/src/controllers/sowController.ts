import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SowController {
  // Get all SOWs for the organization
  async getSows(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search, status, customer_id } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        organization_id: req.user?.organizationId
      };

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (customer_id) {
        where.customer_id = customer_id;
      }

      const [sows, total] = await Promise.all([
        prisma.sow.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { created_at: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            projects: {
              select: {
                id: true,
                name: true,
                status: true,
                billing_model: true
              }
            }
          }
        }),
        prisma.sow.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        data: sows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: totalPages,
          has_next: Number(page) < totalPages,
          has_prev: Number(page) > 1
        }
      });
    } catch (error) {
      console.error('Error fetching SOWs:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch SOWs'
        }
      });
    }
  }

  // Get a specific SOW by ID
  async getSow(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const sow = await prisma.sow.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              billing_settings: true
            }
          },
          projects: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              billing_model: true,
              start_date: true,
              end_date: true,
              budget_hours: true,
              hourly_rate: true,
              _count: {
                select: {
                  time_entries: true
                }
              }
            }
          }
        }
      });

      if (!sow) {
        return res.status(404).json({
          error: {
            code: 'SOW_NOT_FOUND',
            message: 'SOW not found'
          }
        });
      }

      return res.json({ data: sow });
    } catch (error) {
      console.error('Error fetching SOW:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch SOW'
        }
      });
    }
  }

  // Create a new SOW
  async createSow(req: Request, res: Response) {
    try {
      const {
        customer_id,
        title,
        description,
        scope_of_work,
        deliverables,
        billing_terms,
        hourly_rate,
        total_budget,
        start_date,
        end_date,
        status = 'draft'
      } = req.body;

      // Validate required fields
      if (!customer_id || !title) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Customer ID and title are required'
          }
        });
      }

      // Verify customer exists and belongs to organization
      const customer = await prisma.customer.findFirst({
        where: {
          id: customer_id,
          organization_id: req.user?.organizationId
        }
      });

      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      const sow = await prisma.sow.create({
        data: {
          organization_id: req.user?.organizationId!,
          customer_id,
          title,
          description,
          scope_of_work,
          deliverables: deliverables || [],
          billing_terms: billing_terms || {},
          hourly_rate,
          total_budget,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          status
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              billing_model: true
            }
          }
        }
      });

      return res.status(201).json({
        data: sow,
        message: 'SOW created successfully'
      });
    } catch (error) {
      console.error('Error creating SOW:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create SOW'
        }
      });
    }
  }

  // Update a SOW
  async updateSow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        scope_of_work,
        deliverables,
        billing_terms,
        hourly_rate,
        total_budget,
        start_date,
        end_date,
        status
      } = req.body;

      // Check if SOW exists and belongs to organization
      const existingSow = await prisma.sow.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!existingSow) {
        return res.status(404).json({
          error: {
            code: 'SOW_NOT_FOUND',
            message: 'SOW not found'
          }
        });
      }

      const sow = await prisma.sow.update({
        where: { id },
        data: {
          title,
          description,
          scope_of_work,
          deliverables,
          billing_terms,
          hourly_rate,
          total_budget,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          status
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              billing_model: true
            }
          }
        }
      });

      return res.json({
        data: sow,
        message: 'SOW updated successfully'
      });
    } catch (error) {
      console.error('Error updating SOW:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update SOW'
        }
      });
    }
  }

  // Delete a SOW (soft delete by setting status to cancelled)
  async deleteSow(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if SOW exists and belongs to organization
      const existingSow = await prisma.sow.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!existingSow) {
        return res.status(404).json({
          error: {
            code: 'SOW_NOT_FOUND',
            message: 'SOW not found'
          }
        });
      }

      // Check if SOW has active projects
      const activeProjects = await prisma.project.count({
        where: {
          sow_id: id,
          status: { in: ['planning', 'active'] }
        }
      });

      if (activeProjects > 0) {
        return res.status(400).json({
          error: {
            code: 'SOW_HAS_ACTIVE_PROJECTS',
            message: 'Cannot delete SOW with active projects'
          }
        });
      }

      // Soft delete by setting status to cancelled
      await prisma.sow.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      return res.json({
        message: 'SOW deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting SOW:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete SOW'
        }
      });
    }
  }

  // Get SOW statistics
  async getSowStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if SOW exists and belongs to organization
      const sow = await prisma.sow.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!sow) {
        return res.status(404).json({
          error: {
            code: 'SOW_NOT_FOUND',
            message: 'SOW not found'
          }
        });
      }

      const [
        totalProjects,
        activeProjects,
        totalTimeEntries,
        totalHours,
        totalBilled
      ] = await Promise.all([
        prisma.project.count({
          where: { sow_id: id }
        }),
        prisma.project.count({
          where: { 
            sow_id: id,
            status: { in: ['planning', 'active'] }
          }
        }),
        prisma.timeEntry.count({
          where: {
            project: { sow_id: id }
          }
        }),
        prisma.timeEntry.aggregate({
          where: {
            project: { sow_id: id },
            is_billable: true
          },
          _sum: { duration_hours: true }
        }),
        prisma.billingItem.aggregate({
          where: {
            billing_batch: {
              project: { sow_id: id }
            }
          },
          _sum: { total_amount: true }
        })
      ]);

      const totalHoursDecimal = totalHours._sum.duration_hours 
        ? Number(totalHours._sum.duration_hours) 
        : 0;

      const budgetUtilization = sow.total_budget 
        ? ((Number(totalBilled._sum.total_amount) || 0) / Number(sow.total_budget)) * 100
        : 0;

      return res.json({
        data: {
          sow: {
            id: sow.id,
            title: sow.title,
            status: sow.status,
            total_budget: sow.total_budget,
            hourly_rate: sow.hourly_rate
          },
          projects: {
            total: totalProjects,
            active: activeProjects
          },
          time_tracking: {
            total_entries: totalTimeEntries,
            total_hours: Math.round(totalHoursDecimal * 100) / 100
          },
          billing: {
            total_billed: totalBilled._sum.total_amount || 0,
            budget_utilization: Math.round(budgetUtilization * 100) / 100
          }
        }
      });
    } catch (error) {
      console.error('Error fetching SOW stats:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch SOW statistics'
        }
      });
    }
  }
}
