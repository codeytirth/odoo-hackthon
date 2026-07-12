const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/fuel-logs
// Filterable by vehicleId query param
router.get('/', authenticateToken, requireRole(['fleet_manager', 'financial_analyst']), async (req, res) => {
  try {
    const { vehicleId } = req.query;
    
    const filter = {};
    if (vehicleId) {
      const parsedVehicleId = parseInt(vehicleId);
      if (!isNaN(parsedVehicleId)) {
        filter.vehicleId = parsedVehicleId;
      }
    }

    const logs = await prisma.fuelLog.findMany({
      where: filter,
      include: {
        vehicle: {
          select: {
            regNumber: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ data: logs });
  } catch (error) {
    console.error('Fetch fuel logs error:', error);
    res.status(500).json({ error: 'Internal server error fetching fuel logs.' });
  }
});

// POST /api/fuel-logs
router.post('/', authenticateToken, requireRole(['fleet_manager', 'financial_analyst']), async (req, res) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;

    if (vehicleId === undefined || liters === undefined || cost === undefined || !date) {
      return res.status(400).json({ error: 'vehicleId, liters, cost, and date are required.' });
    }

    const parsedVehicleId = parseInt(vehicleId);
    const parsedLiters = parseFloat(liters);
    const parsedCost = parseFloat(cost);
    const parsedDate = new Date(date);

    if (isNaN(parsedVehicleId)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    if (isNaN(parsedLiters) || parsedLiters <= 0) {
      return res.status(400).json({ error: 'Liters must be a positive number.' });
    }

    if (isNaN(parsedCost) || parsedCost <= 0) {
      return res.status(400).json({ error: 'Cost must be a positive number.' });
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date.' });
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parsedVehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const newLog = await prisma.fuelLog.create({
      data: {
        vehicleId: parsedVehicleId,
        liters: parsedLiters,
        cost: parsedCost,
        date: parsedDate
      },
      include: {
        vehicle: {
          select: {
            regNumber: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Create fuel log error:', error);
    res.status(500).json({ error: 'Internal server error creating fuel log.' });
  }
});

module.exports = router;
