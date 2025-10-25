import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      domain: 'acme.com',
      settings: {
        timezone: 'America/New_York',
        date_format: 'MM/DD/YYYY',
        currency: 'USD'
      },
      subscription_plan: 'pro',
      is_active: true
    }
  });

  console.log('✅ Created organization:', organization.name);

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: 'admin-keycloak-id',
      email: 'admin@acme.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      organization_id: organization.id,
      keycloak_id: 'user-keycloak-id',
      email: 'user@acme.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'employee',
      is_active: true
    }
  });

  console.log('✅ Created users:', adminUser.email, regularUser.email);

  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      organization_id: organization.id,
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
        hourly_rate: 150.00
      },
      is_active: true
    }
  });

  console.log('✅ Created customer:', customer.name);

  // Create SOW
  const sow = await prisma.sow.create({
    data: {
      organization_id: organization.id,
      customer_id: customer.id,
      title: 'Website Development Project',
      description: 'Complete website redesign and development',
      scope_of_work: 'Design and develop a modern, responsive website with e-commerce functionality',
      deliverables: [
        'Homepage design and development',
        'Product catalog pages',
        'Shopping cart functionality',
        'User authentication system',
        'Admin dashboard'
      ],
      billing_terms: {
        payment_schedule: 'Monthly',
        late_fee_percentage: 1.5
      },
      hourly_rate: 150.00,
      total_budget: 50000.00,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-06-30'),
      status: 'active'
    }
  });

  console.log('✅ Created SOW:', sow.title);

  // Create test projects
  const project1 = await prisma.project.create({
    data: {
      organization_id: organization.id,
      customer_id: customer.id,
      sow_id: sow.id,
      name: 'Frontend Development',
      description: 'React-based frontend development',
      billing_model: 'timesheet',
      status: 'active',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-03-31'),
      budget_hours: 200.0,
      hourly_rate: 150.00,
      is_billable: true
    }
  });

  const project2 = await prisma.project.create({
    data: {
      organization_id: organization.id,
      customer_id: customer.id,
      sow_id: sow.id,
      name: 'Backend Development',
      description: 'Node.js backend API development',
      billing_model: 'task-based',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-04-30'),
      budget_hours: 150.0,
      hourly_rate: 150.00,
      is_billable: true
    }
  });

  console.log('✅ Created projects:', project1.name, project2.name);

  // Create project members
  await prisma.projectMember.createMany({
    data: [
      {
        project_id: project1.id,
        user_id: adminUser.id,
        role: 'lead'
      },
      {
        project_id: project1.id,
        user_id: regularUser.id,
        role: 'member'
      },
      {
        project_id: project2.id,
        user_id: adminUser.id,
        role: 'lead'
      },
      {
        project_id: project2.id,
        user_id: regularUser.id,
        role: 'member'
      }
    ]
  });

  console.log('✅ Created project members');

  // Create sample time entries
  const timeEntry1 = await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      user_id: regularUser.id,
      project_id: project1.id,
      task_description: 'Implemented homepage layout',
      start_time: new Date('2024-01-15T09:00:00Z'),
      end_time: new Date('2024-01-15T17:00:00Z'),
      duration_minutes: 480,
      is_timer_active: false,
      is_billable: true,
      hourly_rate: 150.00,
      status: 'approved'
    }
  });

  const timeEntry2 = await prisma.timeEntry.create({
    data: {
      organization_id: organization.id,
      user_id: regularUser.id,
      project_id: project2.id,
      task_description: 'Set up API authentication',
      start_time: new Date('2024-01-16T09:00:00Z'),
      end_time: new Date('2024-01-16T12:00:00Z'),
      duration_minutes: 180,
      is_timer_active: false,
      is_billable: true,
      hourly_rate: 150.00,
      status: 'draft'
    }
  });

  console.log('✅ Created time entries');

  // Create sample timesheet
  const timesheet = await prisma.timesheet.create({
    data: {
      organization_id: organization.id,
      user_id: regularUser.id,
      week_start_date: new Date('2024-01-15'),
      week_end_date: new Date('2024-01-21'),
      status: 'draft',
      total_hours: 40.0
    }
  });

  // Create timesheet entries
  await prisma.timesheetEntry.createMany({
    data: [
      {
        organization_id: organization.id,
        timesheet_id: timesheet.id,
        project_id: project1.id,
        entry_date: new Date('2024-01-15'),
        hours_monday: 8.0,
        task_description: 'Homepage development'
      },
      {
        organization_id: organization.id,
        timesheet_id: timesheet.id,
        project_id: project2.id,
        entry_date: new Date('2024-01-16'),
        hours_tuesday: 3.0,
        task_description: 'API authentication setup'
      }
    ]
  });

  console.log('✅ Created timesheet and entries');

  // Create billing batch
  const billingBatch = await prisma.billingBatch.create({
    data: {
      organization_id: organization.id,
      project_id: project1.id,
      batch_name: 'January 2024 Invoice',
      batch_type: 'invoice',
      status: 'draft',
      total_amount: 1200.00,
      total_hours: 8.0,
      currency: 'USD',
      invoice_date: new Date('2024-01-31'),
      due_date: new Date('2024-02-15'),
      created_by: adminUser.id
    }
  });

  // Create billing items
  await prisma.billingItem.create({
    data: {
      billing_batch_id: billingBatch.id,
      time_entry_id: timeEntry1.id,
      item_type: 'time_entry',
      description: 'Homepage development - 8 hours',
      quantity: 8.0,
      unit_rate: 150.00,
      total_amount: 1200.00,
      is_billable: true,
      billing_date: new Date('2024-01-15')
    }
  });

  console.log('✅ Created billing batch and items');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organization: ${organization.name}`);
  console.log(`- Users: ${adminUser.email}, ${regularUser.email}`);
  console.log(`- Customer: ${customer.name}`);
  console.log(`- Projects: ${project1.name}, ${project2.name}`);
  console.log(`- Time Entries: 2`);
  console.log(`- Timesheets: 1`);
  console.log(`- Billing Batch: ${billingBatch.batch_name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });