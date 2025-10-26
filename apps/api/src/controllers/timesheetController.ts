import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TimesheetController {
  // Get all timesheets for the organization
  async getTimesheets(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, user_id, status, week_start, week_end } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        organization_id: req.user?.organizationId
      };

      if (user_id) {
        where.user_id = user_id;
      }

      if (status) {
        where.status = status;
      }

      if (week_start) {
        where.week_start_date = { gte: new Date(week_start as string) };
      }

      if (week_end) {
        where.week_end_date = { lte: new Date(week_end as string) };
      }

      const [timesheets, total] = await Promise.all([
        prisma.timesheet.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { week_start_date: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true
              }
            },
            timesheet_entries: {
              select: {
                id: true,
                project_id: true,
                entry_date: true,
                hours_monday: true,
                hours_tuesday: true,
                hours_wednesday: true,
                hours_thursday: true,
                hours_friday: true,
                hours_saturday: true,
                hours_sunday: true,
                task_description: true,
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
            }
          }
        }),
        prisma.timesheet.count({ where })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        data: timesheets,
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
      console.error('Error fetching timesheets:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch timesheets'
        }
      });
    }
  }

  // Get a specific timesheet by ID
  async getTimesheet(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const timesheet = await prisma.timesheet.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
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
          timesheet_entries: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  billing_model: true,
                  customer: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { entry_date: 'asc' }
          }
        }
      });

      if (!timesheet) {
        return res.status(404).json({
          error: {
            code: 'TIMESHEET_NOT_FOUND',
            message: 'Timesheet not found'
          }
        });
      }

      return res.json({ data: timesheet });
    } catch (error) {
      console.error('Error fetching timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch timesheet'
        }
      });
    }
  }

  // Create a new timesheet
  async createTimesheet(req: Request, res: Response) {
    try {
      const {
        user_id,
        week_start_date,
        week_end_date,
        notes
      } = req.body;

      // Validate required fields
      if (!user_id || !week_start_date || !week_end_date) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'User ID, week start date, and week end date are required'
          }
        });
      }

      // Verify user exists and belongs to organization
      const user = await prisma.user.findFirst({
        where: {
          uuid: user_id,
          organization: {
            uuid: req.user?.organizationId
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Check if timesheet already exists for this week
      const existingTimesheet = await prisma.timesheet.findFirst({
        where: {
          organization_id: req.user?.organizationId,
          user_id,
          week_start_date: new Date(week_start_date)
        }
      });

      if (existingTimesheet) {
        return res.status(409).json({
          error: {
            code: 'TIMESHEET_EXISTS',
            message: 'Timesheet already exists for this week'
          }
        });
      }

      const timesheet = await prisma.timesheet.create({
        data: {
          organization_id: req.user?.organizationId!,
          user_id,
          week_start_date: new Date(week_start_date),
          week_end_date: new Date(week_end_date),
          status: 'draft',
          total_hours: 0,
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
          timesheet_entries: true
        }
      });

      return res.status(201).json({
        data: timesheet,
        message: 'Timesheet created successfully'
      });
    } catch (error) {
      console.error('Error creating timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create timesheet'
        }
      });
    }
  }

  // Update a timesheet
  async updateTimesheet(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        status,
        notes,
        total_hours
      } = req.body;

      // Check if timesheet exists and belongs to organization
      const existingTimesheet = await prisma.timesheet.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!existingTimesheet) {
        return res.status(404).json({
          error: {
            code: 'TIMESHEET_NOT_FOUND',
            message: 'Timesheet not found'
          }
        });
      }

      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (total_hours !== undefined) updateData.total_hours = total_hours;

      // Set submission/approval timestamps
      if (status === 'submitted' && existingTimesheet.status === 'draft') {
        updateData.submitted_at = new Date();
      }
      if (status === 'approved' && existingTimesheet.status === 'submitted') {
        updateData.approved_at = new Date();
        updateData.approved_by = req.user?.id;
      }

      const timesheet = await prisma.timesheet.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
          timesheet_entries: {
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
              }
            }
          }
        }
      });

      return res.json({
        data: timesheet,
        message: 'Timesheet updated successfully'
      });
    } catch (error) {
      console.error('Error updating timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update timesheet'
        }
      });
    }
  }

  // Submit timesheet for approval
  async submitTimesheet(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const timesheet = await prisma.timesheet.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!timesheet) {
        return res.status(404).json({
          error: {
            code: 'TIMESHEET_NOT_FOUND',
            message: 'Timesheet not found'
          }
        });
      }

      if (timesheet.status !== 'draft') {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only draft timesheets can be submitted'
          }
        });
      }

      const updatedTimesheet = await prisma.timesheet.update({
        where: { id },
        data: {
          status: 'submitted',
          submitted_at: new Date()
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
          timesheet_entries: {
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
              }
            }
          }
        }
      });

      return res.json({
        data: updatedTimesheet,
        message: 'Timesheet submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit timesheet'
        }
      });
    }
  }

  // Approve timesheet
  async approveTimesheet(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const timesheet = await prisma.timesheet.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!timesheet) {
        return res.status(404).json({
          error: {
            code: 'TIMESHEET_NOT_FOUND',
            message: 'Timesheet not found'
          }
        });
      }

      if (timesheet.status !== 'submitted') {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only submitted timesheets can be approved'
          }
        });
      }

      const updatedTimesheet = await prisma.timesheet.update({
        where: { id },
        data: {
          status: 'approved',
          approved_at: new Date(),
          approved_by: req.user?.id,
          notes: notes || timesheet.notes
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
          timesheet_entries: {
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
              }
            }
          }
        }
      });

      return res.json({
        data: updatedTimesheet,
        message: 'Timesheet approved successfully'
      });
    } catch (error) {
      console.error('Error approving timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to approve timesheet'
        }
      });
    }
  }

  // Reject timesheet
  async rejectTimesheet(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const timesheet = await prisma.timesheet.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!timesheet) {
        return res.status(404).json({
          error: {
            code: 'TIMESHEET_NOT_FOUND',
            message: 'Timesheet not found'
          }
        });
      }

      if (timesheet.status !== 'submitted') {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only submitted timesheets can be rejected'
          }
        });
      }

      const updatedTimesheet = await prisma.timesheet.update({
        where: { id },
        data: {
          status: 'rejected',
          notes: notes || timesheet.notes
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
          timesheet_entries: {
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
              }
            }
          }
        }
      });

      return res.json({
        data: updatedTimesheet,
        message: 'Timesheet rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reject timesheet'
        }
      });
    }
  }

  // Delete a timesheet
  async deleteTimesheet(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if timesheet exists and belongs to organization
      const existingTimesheet = await prisma.timesheet.findFirst({
        where: {
          id,
          organization_id: req.user?.organizationId
        }
      });

      if (!existingTimesheet) {
        return res.status(404).json({
          error: {
            code: 'TIMESHEET_NOT_FOUND',
            message: 'Timesheet not found'
          }
        });
      }

      // Only allow deletion of draft timesheets
      if (existingTimesheet.status !== 'draft') {
        return res.status(400).json({
          error: {
            code: 'CANNOT_DELETE',
            message: 'Only draft timesheets can be deleted'
          }
        });
      }

      await prisma.timesheet.delete({
        where: { id }
      });

      return res.json({
        message: 'Timesheet deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete timesheet'
        }
      });
    }
  }
}
