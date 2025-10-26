import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BillingController {
  // Get all billing batches for the organization
  async getBillingBatches(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, project_id, batch_type } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        organization: {
          uuid: req.user?.organizationId
        }
      };

      if (status) {
        where.status = status;
      }

      if (project_id) {
        where.project_id = project_id;
      }

      if (batch_type) {
        where.batch_type = batch_type;
      }

      const [batches, total] = await Promise.all([
        prisma.billingBatch.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { created_at: 'desc' },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                customer: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            created_by_user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true
              }
            },
            billing_items: {
              select: {
                id: true,
                description: true,
                quantity: true,
                unit_rate: true,
                total_amount: true,
                billing_date: true
              }
            },
            _count: {
              select: {
                billing_items: true
              }
            }
          }
        }),
        prisma.billingBatch.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        data: batches,
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
      console.error('Error fetching billing batches:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch billing batches'
        }
      });
    }
  }

  // Get a specific billing batch by ID
  async getBillingBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const batch = await prisma.billingBatch.findFirst({
        where: {
          id: parseInt(id),
          organization: {
            uuid: req.user?.organizationId
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  billing_settings: true
                }
              }
            }
          },
          created_by_user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
          billing_items: {
            include: {
              time_entry: {
                select: {
                  id: true,
                  task_description: true,
                  entry_date: true,
                  duration_hours: true,
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
              timesheet: {
                select: {
                  id: true,
                  week_start_date: true,
                  week_end_date: true,
                  total_hours: true,
                  user: {
                    select: {
                      id: true,
                      email: true,
                      first_name: true,
                      last_name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!batch) {
        return res.status(404).json({
          error: {
            code: 'BILLING_BATCH_NOT_FOUND',
            message: 'Billing batch not found'
          }
        });
      }

      return res.json({ data: batch });
    } catch (error) {
      console.error('Error fetching billing batch:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch billing batch'
        }
      });
    }
  }

  // Create a new billing batch
  async createBillingBatch(req: Request, res: Response) {
    try {
      const {
        project_id,
        batch_name,
        batch_type = 'manual',
        invoice_date,
        due_date,
        notes
      } = req.body;

      // Validate required fields
      if (!batch_name) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Batch name is required'
          }
        });
      }

      // Verify project exists and belongs to organization (if provided)
      if (project_id) {
        const project = await prisma.project.findFirst({
          where: {
            id: project_id,
            organization: {
            uuid: req.user?.organizationId
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
      }

      // Get the integer organization ID
      const organization = await prisma.organization.findFirst({
        where: { uuid: req.user?.organizationId },
        select: { id: true }
      });

      if (!organization) {
        return res.status(404).json({
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        });
      }

      const batch = await prisma.billingBatch.create({
        data: {
          organization_id: organization.id,
          project_id,
          batch_name,
          batch_type,
          status: 'draft',
          total_amount: 0,
          total_hours: 0,
          currency: 'USD',
          invoice_date: invoice_date ? new Date(invoice_date) : null,
          due_date: due_date ? new Date(due_date) : null,
          notes,
          created_by: parseInt(req.user?.id!)
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          created_by_user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
          billing_items: true
        }
      });

      return res.status(201).json({
        data: batch,
        message: 'Billing batch created successfully'
      });
    } catch (error) {
      console.error('Error creating billing batch:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create billing batch'
        }
      });
    }
  }

  // Update a billing batch
  async updateBillingBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        batch_name,
        batch_type,
        status,
        invoice_number,
        invoice_date,
        due_date,
        quickbooks_invoice_id,
        quickbooks_sync_status,
        notes
      } = req.body;

      // Check if batch exists and belongs to organization
      const existingBatch = await prisma.billingBatch.findFirst({
        where: {
          id: parseInt(id),
          organization: {
            uuid: req.user?.organizationId
          }
        }
      });

      if (!existingBatch) {
        return res.status(404).json({
          error: {
            code: 'BILLING_BATCH_NOT_FOUND',
            message: 'Billing batch not found'
          }
        });
      }

      const updateData: any = {};
      if (batch_name !== undefined) updateData.batch_name = batch_name;
      if (batch_type !== undefined) updateData.batch_type = batch_type;
      if (status !== undefined) updateData.status = status;
      if (invoice_number !== undefined) updateData.invoice_number = invoice_number;
      if (invoice_date !== undefined) updateData.invoice_date = invoice_date ? new Date(invoice_date) : null;
      if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
      if (quickbooks_invoice_id !== undefined) updateData.quickbooks_invoice_id = quickbooks_invoice_id;
      if (quickbooks_sync_status !== undefined) updateData.quickbooks_sync_status = quickbooks_sync_status;
      if (notes !== undefined) updateData.notes = notes;

      const batch = await prisma.billingBatch.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          created_by_user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
          billing_items: {
            include: {
              time_entry: {
                select: {
                  id: true,
                  task_description: true,
                  duration_hours: true
                }
              },
              timesheet: {
                select: {
                  id: true,
                  week_start_date: true,
                  week_end_date: true,
                  total_hours: true
                }
              }
            }
          }
        }
      });

      return res.json({
        data: batch,
        message: 'Billing batch updated successfully'
      });
    } catch (error) {
      console.error('Error updating billing batch:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update billing batch'
        }
      });
    }
  }

  // Add items to billing batch
  async addBillingItems(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Items array is required'
          }
        });
      }

      // Check if batch exists and belongs to organization
      const batch = await prisma.billingBatch.findFirst({
        where: {
          id: parseInt(id),
          organization: {
            uuid: req.user?.organizationId
          }
        }
      });

      if (!batch) {
        return res.status(404).json({
          error: {
            code: 'BILLING_BATCH_NOT_FOUND',
            message: 'Billing batch not found'
          }
        });
      }

      // Validate items
      for (const item of items) {
        if (!item.description || !item.quantity || !item.unit_rate) {
          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Each item must have description, quantity, and unit_rate'
            }
          });
        }
      }

      // Create billing items
      const createdItems = await Promise.all(
        items.map(item =>
          prisma.billingItem.create({
            data: {
              billing_batch_id: parseInt(id),
              time_entry_id: item.time_entry_id ? parseInt(item.time_entry_id) : null,
              timesheet_id: item.timesheet_id || null,
              item_type: item.item_type || 'manual',
              description: item.description,
              quantity: item.quantity,
              unit_rate: item.unit_rate,
              total_amount: item.quantity * item.unit_rate,
              is_billable: item.is_billable !== false,
              billing_date: item.billing_date ? new Date(item.billing_date) : new Date()
            }
          })
        )
      );

      // Update batch totals
      const totalAmount = createdItems.reduce((sum, item) => sum + Number(item.total_amount), 0);
      const totalHours = createdItems.reduce((sum, item) => sum + Number(item.quantity), 0);

      await prisma.billingBatch.update({
        where: { id: parseInt(id) },
        data: {
          total_amount: totalAmount,
          total_hours: totalHours
        }
      });

      return res.json({
        data: createdItems,
        message: 'Billing items added successfully'
      });
    } catch (error) {
      console.error('Error adding billing items:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add billing items'
        }
      });
    }
  }

  // Remove item from billing batch
  async removeBillingItem(req: Request, res: Response) {
    try {
      const { id, itemId } = req.params;

      // Check if batch exists and belongs to organization
      const batch = await prisma.billingBatch.findFirst({
        where: {
          id: parseInt(id),
          organization: {
            uuid: req.user?.organizationId
          }
        }
      });

      if (!batch) {
        return res.status(404).json({
          error: {
            code: 'BILLING_BATCH_NOT_FOUND',
            message: 'Billing batch not found'
          }
        });
      }

      // Check if item exists and belongs to batch
      const item = await prisma.billingItem.findFirst({
        where: {
          id: parseInt(itemId),
          billing_batch_id: parseInt(id)
        }
      });

      if (!item) {
        return res.status(404).json({
          error: {
            code: 'BILLING_ITEM_NOT_FOUND',
            message: 'Billing item not found'
          }
        });
      }

      // Delete the item
      await prisma.billingItem.delete({
        where: { id: parseInt(itemId) }
      });

      // Update batch totals
      const remainingItems = await prisma.billingItem.findMany({
        where: { billing_batch_id: parseInt(id) }
      });

      const totalAmount = remainingItems.reduce((sum, item) => sum + Number(item.total_amount), 0);
      const totalHours = remainingItems.reduce((sum, item) => sum + Number(item.quantity), 0);

      await prisma.billingBatch.update({
        where: { id: parseInt(id) },
        data: {
          total_amount: totalAmount,
          total_hours: totalHours
        }
      });

      return res.json({
        message: 'Billing item removed successfully'
      });
    } catch (error) {
      console.error('Error removing billing item:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove billing item'
        }
      });
    }
  }

  // Delete a billing batch
  async deleteBillingBatch(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if batch exists and belongs to organization
      const existingBatch = await prisma.billingBatch.findFirst({
        where: {
          id: parseInt(id),
          organization: {
            uuid: req.user?.organizationId
          }
        }
      });

      if (!existingBatch) {
        return res.status(404).json({
          error: {
            code: 'BILLING_BATCH_NOT_FOUND',
            message: 'Billing batch not found'
          }
        });
      }

      // Only allow deletion of draft batches
      if (existingBatch.status !== 'draft') {
        return res.status(400).json({
          error: {
            code: 'CANNOT_DELETE',
            message: 'Only draft billing batches can be deleted'
          }
        });
      }

      await prisma.billingBatch.delete({
        where: { id: parseInt(id) }
      });

      return res.json({
        message: 'Billing batch deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting billing batch:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete billing batch'
        }
      });
    }
  }

  // Get billing statistics
  async getBillingStats(req: Request, res: Response) {
    try {
      const { project_id, start_date, end_date } = req.query;

      const where: any = {
        organization: {
            uuid: req.user?.organizationId
          }
      };

      if (project_id) {
        where.project_id = project_id;
      }

      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at.gte = new Date(start_date as string);
        if (end_date) where.created_at.lte = new Date(end_date as string);
      }

      const [
        totalBatches,
        draftBatches,
        sentBatches,
        paidBatches,
        totalAmount,
        totalHours,
        recentBatches
      ] = await Promise.all([
        prisma.billingBatch.count({ where }),
        prisma.billingBatch.count({ where: { ...where, status: 'draft' } }),
        prisma.billingBatch.count({ where: { ...where, status: 'sent' } }),
        prisma.billingBatch.count({ where: { ...where, status: 'paid' } }),
        prisma.billingBatch.aggregate({
          where: { ...where, status: { in: ['sent', 'paid'] } },
          _sum: { total_amount: true }
        }),
        prisma.billingBatch.aggregate({
          where: { ...where, status: { in: ['sent', 'paid'] } },
          _sum: { total_hours: true }
        }),
        prisma.billingBatch.findMany({
          where,
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            batch_name: true,
            status: true,
            total_amount: true,
            created_at: true,
            project: {
              select: {
                name: true,
                customer: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        })
      ]);

      return res.json({
        data: {
          batches: {
            total: totalBatches,
            draft: draftBatches,
            sent: sentBatches,
            paid: paidBatches
          },
          amounts: {
            total_billed: totalAmount._sum.total_amount || 0,
            total_hours: totalHours._sum.total_hours || 0
          },
          recent_batches: recentBatches
        }
      });
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch billing statistics'
        }
      });
    }
  }
}
