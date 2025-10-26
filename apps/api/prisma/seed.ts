import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Organization
  const organization = await prisma.organization.upsert({
    where: { domain: 'worklog-dev.com' },
    update: {},
    create: {
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

  // Create Second Organization
  const organization2 = await prisma.organization.upsert({
    where: { domain: 'worklog-prod.com' },
    update: {},
    create: {
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

  console.log('✅ Organization 2 created:', organization2.name);

  // Create Users
  // Note: These Keycloak IDs must match the actual Keycloak user IDs
  const adminUser = await prisma.user.upsert({
    where: { keycloak_id: 'e3dda98c-f2ba-429e-bc3b-9f66c9058db9' },
    update: {},
    create: {
      organization_id: organization.id,
      keycloak_id: 'e3dda98c-f2ba-429e-bc3b-9f66c9058db9', // admin@worklog from Keycloak
      email: 'admin@worklog.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { keycloak_id: '2b55bd9d-10a6-4782-b610-c0dc2ddb2cd2' },
    update: {},
    create: {
      organization_id: organization.id,
      keycloak_id: '2b55bd9d-10a6-4782-b610-c0dc2ddb2cd2', // manager@worklog from Keycloak
      email: 'manager@worklog.com',
      first_name: 'Manager',
      last_name: 'User',
      role: 'manager',
      is_active: true
    }
  });

  const employeeUser = await prisma.user.upsert({
    where: { keycloak_id: '73a4ceb1-2acf-41f5-ae65-83f84e16d708' },
    update: {},
    create: {
      organization_id: organization.id,
      keycloak_id: '73a4ceb1-2acf-41f5-ae65-83f84e16d708', // employee@worklog from Keycloak
      email: 'employee@worklog.com',
      first_name: 'Employee',
      last_name: 'User',
      role: 'employee',
      is_active: true
    }
  });

  console.log('✅ Users created:', { adminUser: adminUser.email, managerUser: managerUser.email, employeeUser: employeeUser.email });

  // Create 20 additional test users
  const testUsers = [];
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        organization_id: organization.id,
        keycloak_id: `test-user-${i}-${Date.now()}`,
        email: `user${i}@worklog.com`,
        first_name: `Test`,
        last_name: `User ${i}`,
        role: i % 3 === 0 ? 'manager' : 'employee',
        is_active: i % 5 !== 0, // Every 5th user is inactive
      }
    });
    testUsers.push(user);
  }
  console.log('✅ Created 20 additional test users');

  // Create Users for Organization 2
  const adminUser2 = await prisma.user.upsert({
    where: { keycloak_id: 'admin-user2-keycloak-id' },
    update: {},
    create: {
      organization_id: organization2.id,
      keycloak_id: 'admin-user2-keycloak-id',
      email: 'admin@worklog-prod.com',
      first_name: 'Admin',
      last_name: 'Production',
      role: 'admin',
      is_active: true
    }
  });

  const managerUser2 = await prisma.user.upsert({
    where: { keycloak_id: 'manager-user2-keycloak-id' },
    update: {},
    create: {
      organization_id: organization2.id,
      keycloak_id: 'manager-user2-keycloak-id',
      email: 'manager@worklog-prod.com',
      first_name: 'Manager',
      last_name: 'Production',
      role: 'manager',
      is_active: true
    }
  });

  const employeeUser2 = await prisma.user.upsert({
    where: { keycloak_id: 'employee-user2-keycloak-id' },
    update: {},
    create: {
      organization_id: organization2.id,
      keycloak_id: 'employee-user2-keycloak-id',
      email: 'employee@worklog-prod.com',
      first_name: 'Employee',
      last_name: 'Production',
      role: 'employee',
      is_active: true
    }
  });

  console.log('✅ Users for Org 2 created:', { adminUser2: adminUser2.email, managerUser2: managerUser2.email, employeeUser2: employeeUser2.email });

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      organization_id: organization.uuid,
      name: 'Tech Startup Inc',
      email: 'contact@techstartup.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA'
      },
      billing_settings: {
        currency: 'USD',
        payment_terms: 'Net 30',
        billing_method: 'email'
      },
      is_active: true
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      organization_id: organization.uuid,
      name: 'Enterprise Corp',
      email: 'billing@enterprise.com',
      phone: '+1-555-0456',
      address: {
        street: '456 Corporate Blvd',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      },
      billing_settings: {
        currency: 'USD',
        payment_terms: 'Net 15',
        billing_method: 'portal'
      },
      is_active: true
    }
  });

  console.log('✅ Customers created:', { customer1: customer1.name, customer2: customer2.name });

  // Create Customers for Organization 2
  const customer3 = await prisma.customer.create({
    data: {
      organization_id: organization2.uuid,
      name: 'Global Services Inc',
      email: 'info@globalservices.com',
      phone: '+1-555-0789',
      address: {
        street: '789 International Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'USA'
      },
      billing_settings: {
        currency: 'USD',
        payment_terms: 'Net 45',
        billing_method: 'email'
      },
      is_active: true
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      organization_id: organization2.uuid,
      name: 'Acme Technology',
      email: 'contact@acmetech.com',
      phone: '+1-555-0901',
      address: {
        street: '101 Silicon Valley Road',
        city: 'Palo Alto',
        state: 'CA',
        zip: '94301',
        country: 'USA'
      },
      billing_settings: {
        currency: 'USD',
        payment_terms: 'Net 30',
        billing_method: 'portal'
      },
      is_active: true
    }
  });

  console.log('✅ Customers for Org 2 created:', { customer3: customer3.name, customer4: customer4.name });

  // Create SOWs (Statements of Work)
  const sow1 = await prisma.sow.create({
    data: {
      organization_id: organization.uuid,
      customer_id: customer1.id,
      title: 'Website Development Project',
      description: 'Complete website redesign and development',
      scope_of_work: 'Design and develop a modern, responsive website with e-commerce functionality',
      deliverables: [
        'Website design mockups',
        'Responsive HTML/CSS implementation',
        'E-commerce integration',
        'Content management system',
        'SEO optimization'
      ],
      billing_terms: {
        billing_model: 'task-based',
        hourly_rate: 150.00,
        payment_schedule: 'monthly'
      },
      hourly_rate: 150.00,
      total_budget: 15000.00,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-03-31'),
      status: 'active'
    }
  });

  const sow2 = await prisma.sow.create({
    data: {
      organization_id: organization.uuid,
      customer_id: customer2.id,
      title: 'Mobile App Development',
      description: 'iOS and Android mobile application development',
      scope_of_work: 'Develop cross-platform mobile application with backend integration',
      deliverables: [
        'Mobile app design',
        'iOS app development',
        'Android app development',
        'Backend API development',
        'App store deployment'
      ],
      billing_terms: {
        billing_model: 'timesheet',
        hourly_rate: 175.00,
        payment_schedule: 'bi-weekly'
      },
      hourly_rate: 175.00,
      total_budget: 25000.00,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-05-31'),
      status: 'active'
    }
  });

  console.log('✅ SOWs created:', { sow1: sow1.title, sow2: sow2.title });

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      organization_id: organization.uuid,
      customer_id: customer1.id,
      sow_id: sow1.id,
      name: 'Tech Startup Website',
      description: 'Modern website development for Tech Startup Inc',
      billing_model: 'task-based',
      status: 'active',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-03-31'),
      budget_hours: 100.00,
      hourly_rate: 150.00,
      is_billable: true
    }
  });

  const project2 = await prisma.project.create({
    data: {
      organization_id: organization.uuid,
      customer_id: customer2.id,
      sow_id: sow2.id,
      name: 'Enterprise Mobile App',
      description: 'Cross-platform mobile app for Enterprise Corp',
      billing_model: 'timesheet',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-05-31'),
      budget_hours: 143.00, // 25000 / 175
      hourly_rate: 175.00,
      is_billable: true
    }
  });

  const project3 = await prisma.project.create({
    data: {
      organization_id: organization.uuid,
      customer_id: customer1.id,
      name: 'Tech Startup Maintenance',
      description: 'Ongoing maintenance and support',
      billing_model: 'task-based',
      status: 'active',
      start_date: new Date('2024-04-01'),
      end_date: new Date('2024-12-31'),
      budget_hours: 50.00,
      hourly_rate: 150.00,
      is_billable: true
    }
  });

  console.log('✅ Projects created:', { 
    project1: project1.name, 
    project2: project2.name, 
    project3: project3.name 
  });

  // Create Projects for Organization 2
  const project4 = await prisma.project.create({
    data: {
      organization_id: organization2.uuid,
      customer_id: customer3.id,
      name: 'Global Platform Development',
      description: 'Enterprise platform for Global Services Inc',
      billing_model: 'task-based',
      status: 'active',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-06-30'),
      budget_hours: 200.00,
      hourly_rate: 175.00,
      is_billable: true
    }
  });

  const project5 = await prisma.project.create({
    data: {
      organization_id: organization2.uuid,
      customer_id: customer4.id,
      name: 'Acme Cloud Migration',
      description: 'Migrate Acme Technology to cloud infrastructure',
      billing_model: 'timesheet',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-08-31'),
      budget_hours: 300.00,
      hourly_rate: 200.00,
      is_billable: true
    }
  });

  console.log('✅ Projects for Org 2 created:', { 
    project4: project4.name, 
    project5: project5.name
  });

  // Create Time Entries (for task-based billing)
  const timeEntry1 = await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      user_id: employeeUser.id,
      project_id: project1.id,
      task_description: 'Frontend development - Homepage',
      entry_date: new Date('2024-01-15'),
      duration_hours: 8.0, // 8 hours
      is_billable: true,
      hourly_rate: 150.00,
      notes: 'Completed homepage layout and responsive design',
      status: 'approved'
    }
  });

  const timeEntry2 = await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      user_id: employeeUser.id,
      project_id: project1.id,
      task_description: 'Backend API development',
      entry_date: new Date('2024-01-16'),
      duration_hours: 6.5, // 6 hours 30 minutes
      is_billable: true,
      hourly_rate: 150.00,
      notes: 'Implemented user authentication and data models',
      status: 'submitted'
    }
  });

  const timeEntry3 = await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      user_id: employeeUser.id,
      project_id: project3.id,
      task_description: 'Bug fixes and updates',
      entry_date: new Date('2024-01-20'),
      duration_hours: 2.0, // 2 hours
      is_billable: true,
      hourly_rate: 150.00,
      notes: 'Fixed responsive issues on mobile devices',
      status: 'draft'
    }
  });

  console.log('✅ Time Entries created:', { 
    timeEntry1: timeEntry1.task_description, 
    timeEntry2: timeEntry2.task_description,
    timeEntry3: timeEntry3.task_description
  });

  // Create Timesheet (for timesheet billing model)
  const timesheet = await prisma.timesheet.upsert({
    where: {
      organization_id_user_id_week_start_date: {
        organization_id: organization.uuid,
        user_id: employeeUser.uuid,
        week_start_date: new Date('2024-01-15')
      }
    },
    update: {},
    create: {
      organization_id: organization.uuid,
      user_id: employeeUser.uuid,
      week_start_date: new Date('2024-01-15'),
      week_end_date: new Date('2024-01-21'),
      status: 'draft',
      total_hours: 32.5,
      notes: 'Week 1 of mobile app development'
    }
  });

  // Create Timesheet Entries
  await prisma.timesheetEntry.create({
    data: {
      organization_id: organization.uuid,
      timesheet_id: timesheet.id,
      project_id: project2.id,
      entry_date: new Date('2024-01-15'),
      hours_monday: 8.0,
      hours_tuesday: 8.0,
      hours_wednesday: 8.0,
      hours_thursday: 8.0,
      hours_friday: 0.5,
      task_description: 'Mobile app UI development'
    }
  });

  console.log('✅ Timesheet created for week of', timesheet.week_start_date);

  // Create Billing Batch
  const billingBatch = await prisma.billingBatch.create({
    data: {
      organization_id: organization.id,
      project_id: project1.id,
      batch_name: 'January 2024 Billing',
      batch_type: 'invoice',
      status: 'draft',
      total_amount: 0, // Will be calculated from items
      total_hours: 0, // Will be calculated from items
      currency: 'USD',
      invoice_date: new Date('2024-01-31'),
      due_date: new Date('2024-02-15'),
      notes: 'Monthly billing for Tech Startup project',
      created_by: adminUser.id
    }
  });

  // Create Billing Items
  await prisma.billingItem.create({
    data: {
      billing_batch_id: billingBatch.id,
      time_entry_id: timeEntry1.id,
      item_type: 'time_entry',
      description: 'Frontend development - Homepage',
      quantity: 8.0,
      unit_rate: 150.00,
      total_amount: 1200.00,
      is_billable: true,
      billing_date: new Date('2024-01-15')
    }
  });

  await prisma.billingItem.create({
    data: {
      billing_batch_id: billingBatch.id,
      time_entry_id: timeEntry2.id,
      item_type: 'time_entry',
      description: 'Backend API development',
      quantity: 6.5,
      unit_rate: 150.00,
      total_amount: 975.00,
      is_billable: true,
      billing_date: new Date('2024-01-16')
    }
  });

  console.log('✅ Billing Batch created:', billingBatch.batch_name);

  // Create Project Approval Workflow
  const approvalWorkflow = await prisma.projectApprovalWorkflow.create({
    data: {
      organization_id: organization.id,
      project_id: project2.id,
      name: 'Standard Mobile App Approval',
      description: 'Standard approval workflow for mobile app development',
      is_active: true
    }
  });

  // Create Approval Steps
  await prisma.approvalStep.create({
    data: {
      workflow_id: approvalWorkflow.id,
      step_order: 1,
      step_name: 'Manager Approval',
      approver_type: 'user',
      approver_user_id: managerUser.id,
      is_required: true,
      auto_approve_after_days: 3
    }
  });

  await prisma.approvalStep.create({
    data: {
      workflow_id: approvalWorkflow.id,
      step_order: 2,
      step_name: 'Client Approval',
      approver_type: 'email',
      approver_email: 'billing@enterprise.com',
      approver_name: 'Enterprise Billing Team',
      is_required: true,
      auto_approve_after_days: 7
    }
  });

  console.log('✅ Approval Workflow created:', approvalWorkflow.name);

  // Create Project Memberships
  console.log('\n👥 Creating Project Memberships...');
  
  // Add employee to project1
  const membership1 = await prisma.projectMembership.create({
    data: {
      organization_id: organization.id,
      project_id: project1.id,
      user_id: employeeUser.id,
      role: 'member',
      hourly_rate: 150.00,
      is_active: true
    }
  });

  // Add employee to project3
  const membership2 = await prisma.projectMembership.create({
    data: {
      organization_id: organization.id,
      project_id: project3.id,
      user_id: employeeUser.id,
      role: 'member',
      hourly_rate: 150.00,
      is_active: true
    }
  });

  // Add manager to project2
  const membership3 = await prisma.projectMembership.create({
    data: {
      organization_id: organization.id,
      project_id: project2.id,
      user_id: managerUser.id,
      role: 'lead',
      hourly_rate: 200.00,
      is_active: true
    }
  });

  console.log('✅ Project Memberships created:', membership1.id, membership2.id, membership3.id);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organization: ${organization.name}`);
  console.log(`- Users: ${adminUser.email}, ${managerUser.email}, ${employeeUser.email}`);
  console.log(`- Customers: ${customer1.name}, ${customer2.name}`);
  console.log(`- SOWs: ${sow1.title}, ${sow2.title}`);
  console.log(`- Projects: ${project1.name}, ${project2.name}, ${project3.name}`);
  console.log(`- Project Memberships: Employee on ${project1.name}, ${project3.name}; Manager on ${project2.name}`);
  console.log(`- Time Entries: ${timeEntry1.task_description}, ${timeEntry2.task_description}, ${timeEntry3.task_description}`);
  console.log(`- Timesheet: Week of ${timesheet.week_start_date.toISOString().split('T')[0]}`);
  console.log(`- Billing Batch: ${billingBatch.batch_name}`);
  console.log(`- Approval Workflow: ${approvalWorkflow.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });