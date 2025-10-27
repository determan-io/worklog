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
      console.log('👤 User role:', req.user.role);

      // Role-based access control
      // Employees can only see their own data
      if (req.user.role === 'employee') {
        console.log('🔒 Employee access - returning only own data');
        const user = await prisma.user.findUnique({
          where: { id: req.user.id }
        });

        if (!user) {
          return res.json({
            data: [],
            message: 'User not found'
          });
        }

        console.log('✅ Returning employee data for:', user.email);

        // Return only public fields
        const userData = {
          uuid: user.uuid,
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role,
          is_active: user.is_active,
          keycloak_id: user.keycloak_id,
          created_at: user.created_at,
          updated_at: user.updated_at
        };

        return res.json({
          data: [userData],
          message: 'User retrieved successfully'
        });
      }

      // Admins and managers can see all users in their organization
      const users = await prisma.user.findMany({
        where: {
          organization_id: organization.id
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log(`✅ Found ${users.length} users for organization ${organization.name}`);

      // Map to public fields only
      const usersData = users.map(user => ({
        uuid: user.uuid,
        id: user.id,
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
        is_active: user.is_active,
        keycloak_id: user.keycloak_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      return res.json({
        data: usersData,
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

      // Only admins and managers can create users
      if (req.user.role === 'employee') {
        console.log('🔒 Employee attempted to create user - blocked');
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators and managers can create users'
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

      // Assign user to organization group in Keycloak
      try {
        // Find the organization group by name (organization.name matches group name)
        const groupsResponse = await axios.get(
          `http://localhost:8080/admin/realms/worklog/groups`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );

        const orgGroup = groupsResponse.data.find((group: any) => group.name === organization.name);
        
        if (orgGroup) {
          await axios.put(
            `http://localhost:8080/admin/realms/worklog/users/${keycloakUserId}/groups/${orgGroup.id}`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`
              }
            }
          );
          console.log('✅ User assigned to organization group in Keycloak');
        } else {
          console.warn(`⚠️ Organization group not found: ${organization.name}`);
        }
      } catch (error) {
        console.error('Error assigning group in Keycloak:', error);
        // Continue even if group assignment fails
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
        },
        select: {
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

      // Role-based access control
      // Employees can only update their own profile and cannot change their role
      const isEmployee = req.user.role === 'employee';
      const isUpdatingSelf = uuid === req.user.uuid;
      
      if (isEmployee && !isUpdatingSelf) {
        console.log('🔒 Employee attempted to update another user - blocked');
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Employees can only update their own profile'
          }
        });
      }

      if (isEmployee && role !== undefined && role !== req.user.role) {
        console.log('🔒 Employee attempted to change role - blocked');
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Employees cannot change roles'
          }
        });
      }

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
        },
        select: {
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

