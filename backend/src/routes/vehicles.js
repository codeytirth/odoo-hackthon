const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vehicles - List all vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehiclesList = await prisma.vehicles.findMany({
      orderBy: { id: 'desc' },
    });
    res.json({ data: vehiclesList });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST /api/vehicles - Register new vehicle (restricted to fleet_manager)
router.post('/', authenticateToken, authorizeRoles('fleet_manager'), async (req, res) => {
  const { reg_number, name, type, max_load, odometer, acquisition_cost, status } = req.body;

  if (!reg_number || !name || !type || max_load === undefined || odometer === undefined || acquisition_cost === undefined) {
    return res.status(400).json({ error: 'Missing required vehicle fields' });
  }

  const parsedMaxLoad = parseFloat(max_load);
  const parsedOdometer = parseFloat(odometer);
  const parsedCost = parseFloat(acquisition_cost);

  if (isNaN(parsedMaxLoad) || isNaN(parsedOdometer) || isNaN(parsedCost)) {
    return res.status(400).json({ error: 'Invalid numeric inputs for max_load, odometer, or acquisition_cost' });
  }

  const validStatuses = ['Available', 'On Trip', 'In Shop', 'Retired'];
  const vehicleStatus = status || 'Available';
  if (!validStatuses.includes(vehicleStatus)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const existingVehicle = await prisma.vehicles.findUnique({
      where: { reg_number },
    });

    if (existingVehicle) {
      return res.status(400).json({ error: 'Registration number must be unique' });
    }

    const newVehicle = await prisma.vehicles.create({
      data: {
        reg_number,
        name,
        type,
        max_load: parsedMaxLoad,
        odometer: parsedOdometer,
        acquisition_cost: parsedCost,
        status: vehicleStatus,
      },
    });

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

module.exports = router;
