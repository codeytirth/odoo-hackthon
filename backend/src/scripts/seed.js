const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Create Users with different roles
  const usersToSeed = [
    { email: 'manager@transitops.com', password: 'password123', role: 'fleet_manager' },
    { email: 'driver@transitops.com', password: 'password123', role: 'driver' },
    { email: 'safety@transitops.com', password: 'password123', role: 'safety_officer' },
    { email: 'finance@transitops.com', password: 'password123', role: 'financial_analyst' },
  ];

  for (const u of usersToSeed) {
    const password_hash = await bcrypt.hash(u.password, 10);
    const existing = await prisma.users.findUnique({
      where: { email: u.email }
    });

    if (!existing) {
      const created = await prisma.users.create({
        data: {
          email: u.email,
          password_hash,
          role: u.role,
        }
      });
      console.log(`Created user: ${created.email} (${created.role})`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  // Create some initial vehicles if empty
  const vehicleCount = await prisma.vehicles.count();
  if (vehicleCount === 0) {
    const createdVehicle = await prisma.vehicles.create({
      data: {
        reg_number: 'Van-05',
        name: 'Mercedes Sprinter',
        type: 'Van',
        max_load: 500.0,
        odometer: 12000.0,
        acquisition_cost: 45000.0,
        status: 'Available',
      }
    });
    console.log(`Created vehicle: ${createdVehicle.reg_number}`);
  }

  // Create some initial drivers if empty
  const driverCount = await prisma.drivers.count();
  if (driverCount === 0) {
    // Expiry date is 1 year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const createdDriver = await prisma.drivers.create({
      data: {
        name: 'Alex',
        license_number: 'DL-987654321',
        license_category: 'Class A',
        license_expiry: oneYearFromNow,
        contact: '+1-555-0199',
        safety_score: 95.0,
        status: 'Available',
      }
    });
    console.log(`Created driver: ${createdDriver.name}`);
  }

  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
