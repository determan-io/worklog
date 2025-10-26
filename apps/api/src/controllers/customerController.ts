import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomerController {
  // Get all customers for the organization
  async getCustomers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search, active } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        organization_id: req.user?.organizationId
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (active !== undefined) {
        where.is_active = active === 'true';
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            projects: {
              select: {
                id: true,
                name: true,
                status: true,
                is_active: true,
                billing_model: true,
                description: true,
                time_entries: {
                  select: {
                    id: true,
                    entry_date: true,
                    duration_hours: true,
                    is_billable: true,
                    status: true
                  }
                }
              }
            },
            sows: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        }),
        prisma.customer.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        data: customers,
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
      console.error('Error fetching customers:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch customers'
        }
      });
    }
  }

  // Get a specific customer by ID
  async getCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              is_active: true,
              billing_model: true,
              start_date: true,
              end_date: true,
              budget_hours: true,
              hourly_rate: true,
              sow: {
                select: {
                  id: true,
                  title: true,
                  status: true
                }
              }
            }
          },
          sows: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              start_date: true,
              end_date: true,
              total_budget: true,
              hourly_rate: true
            }
          }
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

      return res.json({ data: customer });
    } catch (error) {
      console.error('Error fetching customer:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch customer'
        }
      });
    }
  }

  // Create a new customer
  async createCustomer(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        phone,
        address,
        billing_settings
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Customer name is required'
          }
        });
      }

      const customer = await prisma.customer.create({
        data: {
          organization_id: req.user?.organizationId!,
          name,
          email,
          phone,
          address: address || {},
          billing_settings: billing_settings || {
            currency: 'USD',
            payment_terms: 'Net 30'
          },
          is_active: true
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              is_active: true,
              billing_model: true
            }
          },
          sows: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      });

      return res.status(201).json({
        data: customer,
        message: 'Customer created successfully'
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create customer'
        }
      });
    }
  }

  // Update a customer
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        address,
        billing_settings,
        is_active
      } = req.body;

      // Check if customer exists and belongs to organization
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!existingCustomer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          address,
          billing_settings,
          is_active
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              is_active: true,
              billing_model: true
            }
          },
          sows: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      });

      return res.json({
        data: customer,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update customer'
        }
      });
    }
  }

  // Delete a customer (soft delete by setting is_active to false)
  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if customer exists and belongs to organization
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!existingCustomer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      // Check if customer has active projects
      const activeProjects = await prisma.project.count({
        where: {
          customer_id: id,
          status: { in: ['planning', 'active'] }
        }
      });

      if (activeProjects > 0) {
        return res.status(400).json({
          error: {
            code: 'CUSTOMER_HAS_ACTIVE_PROJECTS',
            message: 'Cannot delete customer with active projects'
          }
        });
      }

      // Soft delete by setting is_active to false
      await prisma.customer.update({
        where: { id },
        data: { is_active: false }
      });

      return res.json({
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete customer'
        }
      });
    }
  }

  // Get customer statistics
  async getCustomerStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if customer exists and belongs to organization
      const customer = await prisma.customer.findFirst({
        where: {
          id,
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

      const [
        totalProjects,
        activeProjects,
        totalSows,
        activeSows,
        totalTimeEntries,
        totalHours,
        totalBilled
      ] = await Promise.all([
        prisma.project.count({
          where: { customer_id: id }
        }),
        prisma.project.count({
          where: { 
            customer_id: id,
            status: { in: ['planning', 'active'] }
          }
        }),
        prisma.sow.count({
          where: { customer_id: id }
        }),
        prisma.sow.count({
          where: { 
            customer_id: id,
            status: 'active'
          }
        }),
        prisma.timeEntry.count({
          where: {
            project: { customer_id: id }
          }
        }),
        prisma.timeEntry.aggregate({
          where: {
            project: { customer_id: id },
            is_billable: true
          },
          _sum: { duration_hours: true }
        }),
        prisma.billingItem.aggregate({
          where: {
            billing_batch: {
              project: { customer_id: id }
            }
          },
          _sum: { total_amount: true }
        })
      ]);

      const totalHoursDecimal = totalHours._sum.duration_hours 
        ? Number(totalHours._sum.duration_hours) 
        : 0;

      return res.json({
        data: {
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email
          },
          projects: {
            total: totalProjects,
            active: activeProjects
          },
          sows: {
            total: totalSows,
            active: activeSows
          },
          time_tracking: {
            total_entries: totalTimeEntries,
            total_hours: Math.round(totalHoursDecimal * 100) / 100
          },
          billing: {
            total_billed: totalBilled._sum.total_amount || 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch customer statistics'
        }
      });
    }
  }
}
