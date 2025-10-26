import { Request, Response } from 'express';
import { prisma } from '../index';

export class TimeEntryController {
  // Get time entries
  async getTimeEntries(req: Request, res: Response) {
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
        project_id, 
        user_id, 
        start_date, 
        end_date, 
        page = 1,
        limit = 20
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      // Get organization ID from UUID
      const organization = await prisma.organization.findUnique({
        where: { uuid: req.user.organizationId },
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

      const where: any = {
        organization_id: organization.id
      };

      // If user is not admin/manager, only show their own entries
      if (!['admin', 'manager'].includes(req.user.role)) {
        where.user_id = parseInt(req.user.id);
      } else if (user_id) {
        where.user_id = parseInt(user_id as string);
      }

      if (project_id) {
        where.project_id = project_id;
      }

      if (start_date && end_date) {
        where.entry_date = {
          gte: new Date(start_date as string),
          lte: new Date(end_date as string)
        };
      }

      const [timeEntries, total] = await Promise.all([
        prisma.timeEntry.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: {
            entry_date: 'desc'
          },
          include: {
            user: {
              select: {
                uuid: true,
                email: true,
                first_name: true,
                last_name: true
              }
            },
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
            }
          }
        }),
        prisma.timeEntry.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        data: timeEntries,
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
      console.error('Error fetching time entries:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch time entries'
        }
      });
    }
  }

  // Create time entry
  async createTimeEntry(req: Request, res: Response) {
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
        project_id,
        entry_date,
        duration_hours,
        task_description,
        is_billable = true,
        hourly_rate,
        notes
      } = req.body;

      if (!project_id || !entry_date || !duration_hours || !task_description) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Project ID, entry date, duration hours, and task description are required'
          }
        });
      }

      // Get organization ID from UUID
      const organization = await prisma.organization.findUnique({
        where: { uuid: req.user.organizationId },
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

      // Verify project exists and belongs to organization
      const project = await prisma.project.findFirst({
        where: {
          id: project_id,
          organization: {
            uuid: req.user.organizationId
          }
        },
        select: {
          id: true,
          name: true
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

      const timeEntry = await prisma.timeEntry.create({
        data: {
          organization_id: organization.id,
          user_id: parseInt(req.user.id),
          project_id: project.id,
          entry_date: new Date(entry_date),
          duration_hours: parseFloat(duration_hours),
          task_description,
          is_billable,
          hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
          notes,
          status: 'draft'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
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
          }
        }
      });

      return res.status(201).json({
        data: timeEntry,
        message: 'Time entry created successfully'
      });
    } catch (error) {
      console.error('Error creating time entry:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create time entry'
        }
      });
    }
  }

  // Update time entry
  async updateTimeEntry(req: Request, res: Response) {
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
      const {
        entry_date,
        duration_hours,
        task_description,
        is_billable,
        hourly_rate,
        notes,
        status
      } = req.body;

      // Get time entry
      const timeEntry = await prisma.timeEntry.findFirst({
        where: {
          id: parseInt(id),
          user_id: parseInt(req.user.id)
        }
      });

      if (!timeEntry) {
        return res.status(404).json({
          error: {
            code: 'TIME_ENTRY_NOT_FOUND',
            message: 'Time entry not found or access denied'
          }
        });
      }

      // If updating status to submitted, allow it for draft/rejected entries
      if (status && status === 'submitted') {
        if (!['draft', 'rejected'].includes(timeEntry.status)) {
          return res.status(400).json({
            error: {
              code: 'ENTRY_NOT_SUBMITTABLE',
              message: 'Time entry cannot be submitted. Only draft or rejected entries can be submitted.'
            }
          });
        }
        
        // Update status to submitted
        const updatedEntry = await prisma.timeEntry.update({
          where: { id: timeEntry.id },
          data: { status: 'submitted' },
          include: {
            user: {
              select: {
                uuid: true,
                email: true,
                first_name: true,
                last_name: true
              }
            },
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
            }
          }
        });

        return res.json({
          data: updatedEntry,
          message: 'Time entry submitted successfully'
        });
      }

      // For other updates, check if entry is editable (draft or rejected only)
      if (!['draft', 'rejected'].includes(timeEntry.status)) {
        return res.status(400).json({
          error: {
            code: 'ENTRY_NOT_EDITABLE',
            message: 'Time entry cannot be edited. Only draft or rejected entries can be modified.'
          }
        });
      }

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: timeEntry.id },
        data: {
          entry_date: entry_date ? new Date(entry_date) : undefined,
          duration_hours: duration_hours ? parseFloat(duration_hours) : undefined,
          task_description,
          is_billable,
          hourly_rate: hourly_rate ? parseFloat(hourly_rate) : undefined,
          notes
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
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
          }
        }
      });

      return res.json({
        data: updatedEntry,
        message: 'Time entry updated successfully'
      });
    } catch (error) {
      console.error('Error updating time entry:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update time entry'
        }
      });
    }
  }

  // Delete time entry
  async deleteTimeEntry(req: Request, res: Response) {
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

      // Get time entry
      const timeEntry = await prisma.timeEntry.findFirst({
        where: {
          id: parseInt(id),
          user_id: parseInt(req.user.id)
        }
      });

      if (!timeEntry) {
        return res.status(404).json({
          error: {
            code: 'TIME_ENTRY_NOT_FOUND',
            message: 'Time entry not found or access denied'
          }
        });
      }

      // Check if entry is editable (draft or rejected only)
      if (!['draft', 'rejected'].includes(timeEntry.status)) {
        return res.status(400).json({
          error: {
            code: 'ENTRY_NOT_DELETABLE',
            message: 'Time entry cannot be deleted. Only draft or rejected entries can be deleted.'
          }
        });
      }

      await prisma.timeEntry.delete({
        where: { id: timeEntry.id }
      });

      return res.json({
        message: 'Time entry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete time entry'
        }
      });
    }
  }
}