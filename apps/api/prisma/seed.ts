import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Database is already clean from reset, no need to delete

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'WorkLog Development',
      domain: 'worklog-dev.com',
      settings: {
        timezone: 'America/New_York',
        date_format: 'MM/DD/YYYY',
        currency: 'USD'
      },
      subscription_plan: 'pro',
      is_active: true
    }
  });

  console.log('✅ Organization created:', organization.name);

  // Create Users for Organization 1 - WorkLog Development
  const adminUser = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: 'e2cb6976-7678-40a6-bade-39752a48895e',
      email: 'admin@worklog.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: '7662878f-462d-4ec6-b221-9945d00d97d6',
      email: 'manager@worklog.com',
      first_name: 'Manager',
      last_name: 'User',
      role: 'manager',
      is_active: true
    }
  });

  const employee1 = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: '8998bf11-d14a-4c3d-b817-6ca0280266dc',
      email: 'employee1@worklog.com',
      first_name: 'Employee',
      last_name: 'One',
      role: 'employee',
      is_active: true
    }
  });

  const employee2 = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: '87bdab84-1ba9-4e09-a135-27b47e9f4fa7',
      email: 'employee2@worklog.com',
      first_name: 'Employee',
      last_name: 'Two',
      role: 'employee',
      is_active: true
    }
  });

  const employee3 = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: '65c522c3-e5d3-4df2-a4db-bfd974200812',
      email: 'employee3@worklog.com',
      first_name: 'Employee',
      last_name: 'Three',
      role: 'employee',
      is_active: true
    }
  });

  console.log('✅ Users created');

  // Create Customers (3 customers)
  const customers = [];
  const customerNames = ['Acme Corp', 'TechStart Inc', 'Global Solutions'];
  
  for (let i = 0; i < 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        organization_id: organization.uuid,
        name: customerNames[i],
        email: `contact@${customerNames[i].toLowerCase().replace(' ', '')}.com`,
        phone: `+1-555-000${i + 1}`,
        address: {
          street: `${100 + i * 10} Main St`,
          city: 'San Francisco',
          state: 'CA',
          zip: '9410' + i,
          country: 'USA'
        },
        billing_settings: {
          payment_terms: 'Net 30',
          billing_cycle: 'monthly'
        },
        is_active: true
      }
    });
    customers.push(customer);
  }

  console.log('✅ Created 3 customers');

  // Create Projects (2 per customer = 6 projects)
  const projects = [];
  const projectNames = [
    ['Website Redesign', 'Mobile App Development'],
    ['Cloud Migration', 'API Integration'],
    ['Brand Identity', 'E-commerce Platform']
  ];

  for (let i = 0; i < customers.length; i++) {
    for (let j = 0; j < 2; j++) {
      const project = await prisma.project.create({
        data: {
          organization_id: organization.uuid,
          customer_id: customers[i].id,
          name: projectNames[i][j],
          description: `${projectNames[i][j]} project for ${customers[i].name}`,
          billing_model: j === 0 ? 'timesheet' : 'task-based',
          hourly_rate: j === 0 ? null : 100 + (i * 20),
          budget_hours: j === 0 ? 100 + (i * 20) : null,
          is_billable: true,
          status: 'active',
          is_active: true
        }
      });
      projects.push(project);
    }
  }

  console.log('✅ Created 6 projects');

  // Create Project Memberships (each employee to one project)
  await prisma.projectMembership.create({
    data: {
      organization_id: organization.id,
      project_id: projects[0].id,
      user_id: employee1.id,
      hourly_rate: 75,
      is_active: true
    }
  });

  await prisma.projectMembership.create({
    data: {
      organization_id: organization.id,
      project_id: projects[2].id,
      user_id: employee2.id,
      hourly_rate: 80,
      is_active: true
    }
  });

  await prisma.projectMembership.create({
    data: {
      organization_id: organization.id,
      project_id: projects[4].id,
      user_id: employee3.id,
      hourly_rate: 85,
      is_active: true
    }
  });

  console.log('✅ Created 3 project memberships');

  // Create recent time entry data (last 3 months)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  const employees = [employee1, employee2, employee3];
  const timeEntries = [];

  // Generate recent weekly time entries
  for (let month = 0; month < 3; month++) {
    for (let week = 0; week < 2; week++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + month);
      date.setDate(date.getDate() + (week * 7));
      
      // Random employee for this entry
      const employee = employees[Math.floor(Math.random() * employees.length)];
      
      // Find their project membership
      const membership = await prisma.projectMembership.findFirst({
        where: { user_id: employee.id, is_active: true },
        include: { project: true }
      });

      if (membership) {
        const entry = await prisma.timeEntry.create({
          data: {
            organization_id: organization.id,
            project_id: membership.project.id,
            user_id: employee.id,
            entry_date: date,
            duration_hours: 8.0,
            task_description: `Weekly work on ${membership.project.name}`,
            is_billable: true,
            hourly_rate: membership.hourly_rate,
            status: 'approved',
            approved_at: date,
            approved_by: 'manager@worklog.com'
          }
        });
        timeEntries.push(entry);
      }
    }
  }

  // Create a few recent task entries (this week, last week, 2 weeks ago)
  const recentDates = [
    new Date(), // today
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
  ];

  // First entry (today) - approved
  const today = new Date();
  await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      project_id: projects[0].id,
      user_id: employee1.id,
      entry_date: today,
      duration_hours: 4.5,
      task_description: 'Task-based development work - Implement user authentication',
      is_billable: true,
      hourly_rate: 75,
      status: 'approved',
      approved_at: today,
      approved_by: 'manager@worklog.com'
    }
  });

  // Second entry (7 days ago) - submitted
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      project_id: projects[0].id,
      user_id: employee1.id,
      entry_date: sevenDaysAgo,
      duration_hours: 6.0,
      task_description: 'Frontend development - User interface enhancements',
      is_billable: true,
      hourly_rate: 75,
      status: 'submitted'
    }
  });

  // Third entry (14 days ago) - draft
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      project_id: projects[0].id,
      user_id: employee1.id,
      entry_date: fourteenDaysAgo,
      duration_hours: 3.5,
      task_description: 'Database optimization and query improvements',
      is_billable: true,
      hourly_rate: 75,
      status: 'draft'
    }
  });

  console.log(`✅ Created ${timeEntries.length + 3} time entries over the last 3 months`);

  // Create Second Organization
  console.log('\n🌱 Creating second organization...');
  
  const organization2 = await prisma.organization.create({
    data: {
      name: 'WorkLog Production',
      domain: 'worklog-prod.com',
      settings: {
        timezone: 'America/Los_Angeles',
        date_format: 'MM/DD/YYYY',
        currency: 'USD'
      },
      subscription_plan: 'enterprise',
      is_active: true
    }
  });

  console.log('✅ Second organization created:', organization2.name);

  // Create Users for Organization 2 - WorkLog Production
  const admin2User = await prisma.user.create({
    data: {
      organization_id: organization2.id,
      keycloak_id: '669496aa-a390-4f80-bbe2-de09a98c7e50',
      email: 'admin2@worklog.com',
      first_name: 'Admin',
      last_name: 'Production',
      role: 'admin',
      is_active: true
    }
  });

  const manager2User = await prisma.user.create({
    data: {
      organization_id: organization2.id,
      keycloak_id: '4050a5fd-359d-4d87-b48d-c583fc55f6ae',
      email: 'manager2@worklog.com',
      first_name: 'Manager',
      last_name: 'Production',
      role: 'manager',
      is_active: true
    }
  });

  const employee4 = await prisma.user.create({
    data: {
      organization_id: organization2.id,
      keycloak_id: '1fc9f076-ba2b-468d-b179-37b24d22fb64',
      email: 'employee4@worklog.com',
      first_name: 'Employee',
      last_name: 'Four',
      role: 'employee',
      is_active: true
    }
  });

  const employee5 = await prisma.user.create({
    data: {
      organization_id: organization2.id,
      keycloak_id: '8a4eed69-c9ee-47ca-982b-9f003d5bd276',
      email: 'employee5@worklog.com',
      first_name: 'Employee',
      last_name: 'Five',
      role: 'employee',
      is_active: true
    }
  });

  const employee6 = await prisma.user.create({
    data: {
      organization_id: organization2.id,
      keycloak_id: '6fa91f30-ed28-455b-9625-585c899fa658',
      email: 'employee6@worklog.com',
      first_name: 'Employee',
      last_name: 'Six',
      role: 'employee',
      is_active: true
    }
  });

  console.log('✅ Users created for org 2');

  // Create Customers for Org 2 (3 customers)
  const customers2 = [];
  const customerNames2 = ['Enterprise Corp', 'Innovation Labs', 'Digital Ventures'];
  
  for (let i = 0; i < 3; i++) {
    const customer = await prisma.customer.create({
      data: {
        organization_id: organization2.uuid,
        name: customerNames2[i],
        email: `contact@${customerNames2[i].toLowerCase().replace(' ', '')}.com`,
        phone: `+1-555-100${i + 1}`,
        address: {
          street: `${200 + i * 10} Business Blvd`,
          city: 'Los Angeles',
          state: 'CA',
          zip: '900' + i,
          country: 'USA'
        },
        billing_settings: {
          payment_terms: 'Net 15',
          billing_cycle: 'weekly'
        },
        is_active: true
      }
    });
    customers2.push(customer);
  }

  console.log('✅ Created 3 customers for org 2');

  // Create Projects for Org 2 (2 per customer = 6 projects)
  const projects2 = [];
  const projectNames2 = [
    ['Data Analytics Platform', 'Security Audit'],
    ['AI Integration', 'DevOps Pipeline'],
    ['Customer Portal', 'Payment Gateway']
  ];

  for (let i = 0; i < customers2.length; i++) {
    for (let j = 0; j < 2; j++) {
      const project = await prisma.project.create({
        data: {
          organization_id: organization2.uuid,
          customer_id: customers2[i].id,
          name: projectNames2[i][j],
          description: `${projectNames2[i][j]} project for ${customers2[i].name}`,
          billing_model: j === 0 ? 'timesheet' : 'task-based',
          hourly_rate: j === 0 ? null : 120 + (i * 20),
          budget_hours: j === 0 ? 150 + (i * 30) : null,
          is_billable: true,
          status: 'active',
          is_active: true
        }
      });
      projects2.push(project);
    }
  }

  console.log('✅ Created 6 projects for org 2');

  // Create Project Memberships for Org 2
  await prisma.projectMembership.create({
    data: {
      organization_id: organization2.id,
      project_id: projects2[1].id,
      user_id: employee4.id,
      hourly_rate: 85,
      is_active: true
    }
  });

  await prisma.projectMembership.create({
    data: {
      organization_id: organization2.id,
      project_id: projects2[3].id,
      user_id: employee5.id,
      hourly_rate: 90,
      is_active: true
    }
  });

  await prisma.projectMembership.create({
    data: {
      organization_id: organization2.id,
      project_id: projects2[5].id,
      user_id: employee6.id,
      hourly_rate: 95,
      is_active: true
    }
  });

  console.log('✅ Created 3 project memberships for org 2');

  // Create some time entries for org 2
  const startDate2 = new Date();
  startDate2.setMonth(startDate2.getMonth() - 3);
  
  let timeEntries2 = [];
  const employees2 = [employee4, employee5, employee6];

  for (let month = 0; month < 3; month++) {
    for (let week = 0; week < 2; week++) {
      const date = new Date(startDate2);
      date.setMonth(startDate2.getMonth() + month);
      date.setDate(date.getDate() + (week * 7));
      
      const employee = employees2[Math.floor(Math.random() * employees2.length)];
      
      const membership2 = await prisma.projectMembership.findFirst({
        where: { 
          user_id: employee.id, 
          is_active: true,
          organization_id: organization2.id
        },
        include: { project: true }
      });

      if (membership2) {
        const entry = await prisma.timeEntry.create({
          data: {
            organization_id: organization2.id,
            project_id: membership2.project.id,
            user_id: employee.id,
            entry_date: date,
            duration_hours: 8.0,
            task_description: `Weekly work on ${membership2.project.name}`,
            is_billable: true,
            hourly_rate: membership2.hourly_rate,
            status: 'approved',
            approved_at: date,
            approved_by: 'manager2@worklog.com'
          }
        });
        timeEntries2.push(entry);
      }
    }
  }

  console.log(`✅ Created ${timeEntries2.length} time entries for org 2 over 3 months`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - 2 Organizations: ${organization.name} & ${organization2.name}`);
  console.log(`  - 10 Users (2 admins, 2 managers, 6 employees - 5 per org)`);
  console.log(`  - 6 Customers (3 per org)`);
  console.log(`  - 12 Projects (6 per org)`);
  console.log(`  - 6 Project Memberships (3 per org)`);
  console.log(`  - ${timeEntries.length + 3 + timeEntries2.length} Time Entries`);
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
