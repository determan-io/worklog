import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Helper function to get Keycloak admin token
async function getKeycloakAdminToken(): Promise<string> {
  const response = await axios.post(
    'http://localhost:8080/realms/master/protocol/openid-connect/token',
    new URLSearchParams({
      username: 'admin',
      password: 'admin123',
      grant_type: 'password',
      client_id: 'admin-cli',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
}

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
      const organization = await prisma.organization.findFirst({
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

  // Get user details by UUID
  async getUserByUuid(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const { uuid } = req.params;
      const { organizationId } = req.user;

      // First, get the organization by UUID
      const organization = await prisma.organization.findUnique({
        where: { uuid: organizationId }
      });

      if (!organization) {
        return res.status(404).json({
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          uuid: uuid,
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
          updated_at: true,
          project_memberships: {
            select: {
              id: true,
              uuid: true,
              project_id: true,
              hourly_rate: true,
              is_active: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  is_active: true,
                  billing_model: true,
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

  // Create a new user in both Keycloak and the database
  async createUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const { email, firstName, lastName, role, isActive } = req.body;

      console.log('👤 Creating user:', { email, firstName, lastName, role });

      // Validate required fields
      if (!email || !firstName || !lastName) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, first name, and last name are required'
          }
        });
      }

      // Get organization
      const organization = await prisma.organization.findUnique({
        where: { uuid: req.user.organizationId }
      });

      if (!organization) {
        return res.status(404).json({
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        });
      }

      // Get Keycloak admin token
      const adminToken = await getKeycloakAdminToken();

      // Create user in Keycloak without password
      const keycloakResponse = await axios.post(
        'http://localhost:8080/admin/realms/worklog/users',
        {
          username: email,
          email: email,
          firstName: firstName,
          lastName: lastName,
          enabled: true,
          emailVerified: false,
          requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL']
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      ).catch((error) => {
        console.error('Error creating user in Keycloak:', error.response?.data || error.message);
        throw error;
      });

      // Get the Keycloak user ID from the Location header
      const keycloakUserId = keycloakResponse.headers.location?.split('/').pop();

      if (!keycloakUserId) {
        throw new Error('Failed to get Keycloak user ID');
      }

      console.log('✅ User created in Keycloak:', keycloakUserId);

      // Send verification email to user
      try {
        await axios.put(
          `http://localhost:8080/admin/realms/worklog/users/${keycloakUserId}/execute-actions-email`,
          ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Verification email sent');
      } catch (error) {
        console.error('Error sending verification email:', error);
        // Continue even if email sending fails
      }

      // Assign role to user in Keycloak
      try {
        // Get the role ID
        const roleResponse = await axios.get(
          `http://localhost:8080/admin/realms/worklog/roles/${role}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        // Assign role to user
        await axios.post(
          `http://localhost:8080/admin/realms/worklog/users/${keycloakUserId}/role-mappings/realm`,
          [roleResponse.data],
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Role assigned in Keycloak');
      } catch (error) {
        console.error('Error assigning role in Keycloak:', error);
        // Continue even if role assignment fails
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          organization_id: organization.id,
          keycloak_id: keycloakUserId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          is_active: isActive !== undefined ? isActive : true
        }
      });

      console.log('✅ User created in database:', user.email);

      res.status(201).json({
        data: user,
        message: 'User created successfully'
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.response?.data?.errorMessage || 'Failed to create user'
        }
      });
    }
  }

  // Update user information
  async updateUser(req: Request, res: Response) {
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
      const { firstName, lastName, role } = req.body;

      console.log('👤 Updating user:', id, { firstName, lastName, role });

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'First name and last name are required'
          }
        });
      }

      // Get organization
      const organization = await prisma.organization.findUnique({
        where: { uuid: req.user.organizationId }
      });

      if (!organization) {
        return res.status(404).json({
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        });
      }

      // Update user in database
      const user = await prisma.user.findFirst({
        where: {
          id: parseInt(id),
          organization_id: organization.id
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

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        }
      });

      console.log('✅ User updated in database:', updatedUser.email);

      // Update user in Keycloak (optional - for name changes)
      if (user.keycloak_id) {
        try {
          const adminToken = await getKeycloakAdminToken();

          await axios.put(
            `http://localhost:8080/admin/realms/worklog/users/${user.keycloak_id}`,
            {
              firstName: firstName,
              lastName: lastName,
            },
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('✅ User updated in Keycloak');
        } catch (error) {
          console.error('Error updating user in Keycloak:', error);
          // Continue even if Keycloak update fails
        }
      }

      res.json({
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update user'
        }
      });
    }
  }

  // Update user by UUID
  async updateUserByUuid(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      const { uuid } = req.params;
      const { firstName, lastName, role, isActive } = req.body;

      console.log('👤 Updating user by UUID:', uuid, { firstName, lastName, role });

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'First name and last name are required'
          }
        });
      }

      // Get organization
      const organization = await prisma.organization.findUnique({
        where: { uuid: req.user.organizationId }
      });

      if (!organization) {
        return res.status(404).json({
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found'
          }
        });
      }

      // Find user by UUID
      const user = await prisma.user.findFirst({
        where: {
          uuid: uuid,
          organization_id: organization.id
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

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { uuid: uuid },
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          is_active: isActive !== undefined ? isActive : user.is_active,
        }
      });

      console.log('✅ User updated in database:', updatedUser.email);

      // Update user in Keycloak (optional - for name changes and active status)
      if (user.keycloak_id) {
        try {
          const adminToken = await getKeycloakAdminToken();

          await axios.put(
            `http://localhost:8080/admin/realms/worklog/users/${user.keycloak_id}`,
            {
              firstName: firstName,
              lastName: lastName,
              enabled: isActive !== undefined ? isActive : user.is_active,
            },
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('✅ User updated in Keycloak');
        } catch (error) {
          console.error('Error updating user in Keycloak:', error);
          // Continue even if Keycloak update fails
        }
      }

      res.json({
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update user'
        }
      });
    }
  }
}

