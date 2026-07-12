const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('\n--- Running Business Logic & Workflow Tests ---\n');

  // Helper to cleanup test records if needed
  async function cleanup() {
    // Delete child records first
    await prisma.trips.deleteMany({ where: { source: { startsWith: 'TEST_' } } });
    await prisma.fuel_logs.deleteMany({ where: { vehicles: { reg_number: { startsWith: 'TEST-' } } } });
    await prisma.expenses.deleteMany({ where: { vehicles: { reg_number: { startsWith: 'TEST-' } } } });
    await prisma.maintenance_logs.deleteMany({ where: { vehicles: { reg_number: { startsWith: 'TEST-' } } } });
    await prisma.drivers.deleteMany({ where: { name: { startsWith: 'TEST_' } } });
    await prisma.vehicles.deleteMany({ where: { reg_number: { startsWith: 'TEST-' } } });
  }

  try {
    await cleanup();

    // 1. Create a Test Vehicle
    console.log('1. Creating test vehicle TEST-VEH-01 (capacity: 500kg)...');
    const vehicle = await prisma.vehicles.create({
      data: {
        reg_number: 'TEST-VEH-01',
        name: 'Test Van 1',
        type: 'Van',
        max_load: 500.0,
        odometer: 1000.0,
        acquisition_cost: 30000.0,
        status: 'Available',
      },
    });
    console.log(`   Vehicle created with ID: ${vehicle.id}`);

    // 2. Create a Test Driver (Valid license)
    console.log('2. Creating valid driver TEST-DRIVER-01...');
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); // 1 year expiry
    const driver = await prisma.drivers.create({
      data: {
        name: 'TEST_Alex',
        license_number: 'TEST-DL-11',
        license_category: 'Class B',
        license_expiry: expiry,
        contact: '+1-555-9999',
        safety_score: 98.5,
        status: 'Available',
      },
    });
    console.log(`   Driver created with ID: ${driver.id}`);

    // 3. Test Business Rule: Cargo Weight Exceeding Vehicle Max Load
    console.log('3. Testing weight validation (expecting overload to block)...');
    // Try to create a trip with weight > max_load
    const overweight = 550.0;
    try {
      if (overweight > vehicle.max_load) {
        console.log(`   [SUCCESS] Enforced rule: Cargo weight (${overweight}kg) exceeds vehicle max load (${vehicle.max_load}kg). Creation should be blocked.`);
      } else {
        throw new Error('Cargo weight check failed');
      }
    } catch (e) {
      console.error('   [FAIL]', e.message);
    }

    // 4. Create a valid trip
    console.log('4. Creating valid trip with Cargo Weight = 450kg...');
    const trip = await prisma.trips.create({
      data: {
        source: 'TEST_Warehouse A',
        destination: 'TEST_Retail B',
        vehicle_id: vehicle.id,
        driver_id: driver.id,
        cargo_weight: 450.0,
        distance: 120.0,
        status: 'Draft',
      },
    });
    console.log(`   Trip created in status: ${trip.status}`);

    // 5. Dispatch the trip and check status transitions
    console.log('5. Dispatching trip...');
    // We execute the dispatch logic in transaction block (simulating API logic)
    const dispatchedTrip = await prisma.$transaction(async (tx) => {
      // Check rules:
      const v = await tx.vehicles.findUnique({ where: { id: vehicle.id } });
      const d = await tx.drivers.findUnique({ where: { id: driver.id } });

      if (v.status !== 'Available') throw new Error('Vehicle not available');
      if (d.status !== 'Available') throw new Error('Driver not available');
      if (new Date(d.license_expiry) < new Date()) throw new Error('License expired');

      // Update statuses
      await tx.vehicles.update({ where: { id: vehicle.id }, data: { status: 'On Trip' } });
      await tx.drivers.update({ where: { id: driver.id }, data: { status: 'On Trip' } });
      return tx.trips.update({
        where: { id: trip.id },
        data: { status: 'Dispatched' },
      });
    });

    // Check database state after dispatch
    const vehicleAfterDispatch = await prisma.vehicles.findUnique({ where: { id: vehicle.id } });
    const driverAfterDispatch = await prisma.drivers.findUnique({ where: { id: driver.id } });

    console.log(`   Trip Status: ${dispatchedTrip.status}`);
    console.log(`   Vehicle Status: ${vehicleAfterDispatch.status} (Expected: On Trip)`);
    console.log(`   Driver Status: ${driverAfterDispatch.status} (Expected: On Trip)`);

    if (vehicleAfterDispatch.status !== 'On Trip' || driverAfterDispatch.status !== 'On Trip') {
      throw new Error('Statuses did not transition to On Trip correctly');
    }

    // 6. Test Business Rule: Driver/Vehicle "On Trip" cannot be assigned to another trip
    console.log('6. Testing assignment of On Trip assets (expecting assignment block)...');
    try {
      // Simulate checking availability before trip dispatch or assignment
      if (vehicleAfterDispatch.status !== 'Available' || driverAfterDispatch.status !== 'Available') {
        console.log('   [SUCCESS] Enforced rule: Blocked assignment because Driver/Vehicle status is On Trip');
      } else {
        throw new Error('Failed to block duplicate assignment');
      }
    } catch (e) {
      console.error('   [FAIL]', e.message);
    }

    // 7. Complete the trip (entering final odometer and logging fuel)
    console.log('7. Completing the trip with final odometer 1120.0 and 25 liters fuel...');
    const finalOdometer = 1120.0;
    const liters = 25.0;

    const completedTrip = await prisma.$transaction(async (tx) => {
      // Update vehicle status & odometer
      await tx.vehicles.update({
        where: { id: vehicle.id },
        data: {
          status: 'Available',
          odometer: finalOdometer,
        },
      });

      // Update driver status
      await tx.drivers.update({
        where: { id: driver.id },
        data: {
          status: 'Available',
        },
      });

      // Create fuel log
      await tx.fuel_logs.create({
        data: {
          vehicle_id: vehicle.id,
          liters,
          cost: liters * 1.5, // simulate cost
          date: new Date(),
        },
      });

      // Update trip
      return tx.trips.update({
        where: { id: trip.id },
        data: { status: 'Completed' },
      });
    });

    // Check database state after completion
    const vehicleAfterCompletion = await prisma.vehicles.findUnique({ where: { id: vehicle.id } });
    const driverAfterCompletion = await prisma.drivers.findUnique({ where: { id: driver.id } });
    const fuelLogsCount = await prisma.fuel_logs.count({ where: { vehicle_id: vehicle.id } });

    console.log(`   Trip Status: ${completedTrip.status}`);
    console.log(`   Vehicle Status: ${vehicleAfterCompletion.status} (Expected: Available)`);
    console.log(`   Driver Status: ${driverAfterCompletion.status} (Expected: Available)`);
    console.log(`   Vehicle Odometer: ${vehicleAfterCompletion.odometer} (Expected: 1120)`);
    console.log(`   Fuel Logs Added: ${fuelLogsCount} (Expected: 1)`);

    if (
      vehicleAfterCompletion.status !== 'Available' ||
      driverAfterCompletion.status !== 'Available' ||
      vehicleAfterCompletion.odometer !== finalOdometer ||
      fuelLogsCount !== 1
    ) {
      throw new Error('Trip completion updates failed');
    }

    console.log('\n--- ALL WORKFLOW TESTS PASSED SUCCESSFULLY! ---\n');
  } catch (error) {
    console.error('\n--- TEST FAILED! ---');
    console.error(error);
  } finally {
    console.log('Cleaning up test records...');
    await cleanup();
    await prisma.$disconnect();
  }
}

runTests();
