const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/trips - List all trips with related driver and vehicle details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tripsList = await prisma.trips.findMany({
      include: {
        drivers: true,
        vehicles: true,
      },
      orderBy: { id: 'desc' },
    });
    res.json({ data: tripsList });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// POST /api/trips - Create a trip (Draft status by default)
router.post('/', authenticateToken, authorizeRoles('fleet_manager', 'driver'), async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, distance } = req.body;

  if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !distance) {
    return res.status(400).json({ error: 'Missing required trip fields' });
  }

  const vId = parseInt(vehicle_id);
  const dId = parseInt(driver_id);
  const weight = parseFloat(cargo_weight);
  const dist = parseFloat(distance);

  if (isNaN(vId) || isNaN(dId) || isNaN(weight) || isNaN(dist)) {
    return res.status(400).json({ error: 'Invalid numeric fields for vehicle_id, driver_id, cargo_weight, or distance' });
  }

  try {
    // Check if vehicle exists
    const vehicle = await prisma.vehicles.findUnique({ where: { id: vId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if driver exists
    const driver = await prisma.drivers.findUnique({ where: { id: dId } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Validate cargo weight limit (even for Draft, let's warn or enforce. The rules say: "Cargo weight must not exceed the vehicle's max load capacity.")
    if (weight > vehicle.max_load) {
      return res.status(400).json({ error: `Cargo weight (${weight}kg) exceeds vehicle max load capacity (${vehicle.max_load}kg)` });
    }

    const newTrip = await prisma.trips.create({
      data: {
        source,
        destination,
        vehicle_id: vId,
        driver_id: dId,
        cargo_weight: weight,
        distance: dist,
        status: 'Draft',
      },
      include: {
        drivers: true,
        vehicles: true,
      },
    });

    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// POST /api/trips/:id/dispatch - Dispatch a trip (updates statuses to On Trip)
router.post('/:id/dispatch', authenticateToken, authorizeRoles('fleet_manager', 'driver'), async (req, res) => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    const trip = await prisma.trips.findUnique({
      where: { id: tripId },
      include: { drivers: true, vehicles: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: `Trip cannot be dispatched from status: ${trip.status}` });
    }

    const driver = trip.drivers;
    const vehicle = trip.vehicles;

    // 1. Check Driver status and validity
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: `Driver ${driver.name} is not Available (current status: ${driver.status})` });
    }

    const now = new Date();
    if (new Date(driver.license_expiry) < now) {
      return res.status(400).json({ error: `Driver ${driver.name} has an expired license` });
    }

    if (driver.status === 'Suspended') {
      return res.status(400).json({ error: `Driver ${driver.name} is Suspended` });
    }

    // 2. Check Vehicle status and validity
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle ${vehicle.reg_number} is not Available (current status: ${vehicle.status})` });
    }

    if (vehicle.status === 'In Shop' || vehicle.status === 'Retired') {
      return res.status(400).json({ error: `Vehicle ${vehicle.reg_number} is In Shop or Retired` });
    }

    // 3. Check cargo weight vs vehicle load capacity
    if (trip.cargo_weight > vehicle.max_load) {
      return res.status(400).json({ error: `Cargo weight (${trip.cargo_weight}kg) exceeds vehicle capacity (${vehicle.max_load}kg)` });
    }

    // Perform transaction to dispatch trip and update statuses
    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Update vehicle status
      await tx.vehicles.update({
        where: { id: vehicle.id },
        data: { status: 'On Trip' },
      });

      // Update driver status
      await tx.drivers.update({
        where: { id: driver.id },
        data: { status: 'On Trip' },
      });

      // Update trip status
      return tx.trips.update({
        where: { id: trip.id },
        data: { status: 'Dispatched' },
        include: { drivers: true, vehicles: true },
      });
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error dispatching trip:', error);
    res.status(500).json({ error: 'Failed to dispatch trip' });
  }
});

// POST /api/trips/:id/complete - Complete trip
router.post('/:id/complete', authenticateToken, authorizeRoles('fleet_manager', 'driver'), async (req, res) => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  const { odometer, fuelLiters, fuelCost } = req.body;

  if (odometer === undefined) {
    return res.status(400).json({ error: 'Final vehicle odometer is required to complete trip' });
  }

  const finalOdometer = parseFloat(odometer);
  if (isNaN(finalOdometer)) {
    return res.status(400).json({ error: 'Odometer must be a valid number' });
  }

  try {
    const trip = await prisma.trips.findUnique({
      where: { id: tripId },
      include: { drivers: true, vehicles: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: `Trip cannot be completed from status: ${trip.status}` });
    }

    const vehicle = trip.vehicles;
    const driver = trip.drivers;

    if (finalOdometer < vehicle.odometer) {
      return res.status(400).json({ error: `Final odometer (${finalOdometer}) cannot be less than vehicle's current odometer (${vehicle.odometer})` });
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
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

      // Log Fuel if fuel logs are provided
      if (fuelLiters !== undefined && fuelLiters !== null && parseFloat(fuelLiters) > 0) {
        const liters = parseFloat(fuelLiters);
        const cost = fuelCost ? parseFloat(fuelCost) : 0;
        if (!isNaN(liters)) {
          await tx.fuel_logs.create({
            data: {
              vehicle_id: vehicle.id,
              liters,
              cost: isNaN(cost) ? 0 : cost,
              date: new Date(),
            },
          });
        }
      }

      // Update trip status
      return tx.trips.update({
        where: { id: trip.id },
        data: { status: 'Completed' },
        include: { drivers: true, vehicles: true },
      });
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

// POST /api/trips/:id/cancel - Cancel a trip
router.post('/:id/cancel', authenticateToken, authorizeRoles('fleet_manager', 'driver'), async (req, res) => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    const trip = await prisma.trips.findUnique({
      where: { id: tripId },
      include: { drivers: true, vehicles: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({ error: `Trip already resolved with status: ${trip.status}` });
    }

    const originalStatus = trip.status;

    const updatedTrip = await prisma.$transaction(async (tx) => {
      // If the trip was already dispatched, restore driver and vehicle to Available
      if (originalStatus === 'Dispatched') {
        await tx.vehicles.update({
          where: { id: trip.vehicle_id },
          data: { status: 'Available' },
        });

        await tx.drivers.update({
          where: { id: trip.driver_id },
          data: { status: 'Available' },
        });
      }

      return tx.trips.update({
        where: { id: tripId },
        data: { status: 'Cancelled' },
        include: { drivers: true, vehicles: true },
      });
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error cancelling trip:', error);
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
});

module.exports = router;
