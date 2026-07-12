const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/maintenance
// Accessible by fleet_manager, safety_officer, financial_analyst
router.get('/', authenticateToken, requireRole(['fleet_manager', 'safety_officer', 'financial_analyst']), async (req, res) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: {
        vehicle: {
          select: {
            regNumber: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { openedAt: 'desc' }
    });
    res.json({ data: logs });
  } catch (error) {
    console.error('Fetch maintenance logs error:', error);
    res.status(500).json({ error: 'Internal server error fetching maintenance logs.' });
  }
});

// POST /api/maintenance
// Only fleet_manager can create/open maintenance logs
router.post('/', authenticateToken, requireRole(['fleet_manager']), async (req, res) => {
  try {
    const { vehicleId, description, cost, status } = req.body;

    if (vehicleId === undefined || !description || cost === undefined) {
      return res.status(400).json({ error: 'vehicleId, description, and cost are required.' });
    }

    const parsedVehicleId = parseInt(vehicleId);
    const parsedCost = parseFloat(cost);

    if (isNaN(parsedVehicleId)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    if (isNaN(parsedCost) || parsedCost < 0) {
      return res.status(400).json({ error: 'Cost must be a non-negative number.' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parsedVehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Cannot perform maintenance on a retired vehicle.' });
    }

    const logStatus = status || 'Open';

    // Perform operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create maintenance log
      const newLog = await tx.maintenanceLog.create({
        data: {
          vehicleId: parsedVehicleId,
          description: description.trim(),
          cost: parsedCost,
          status: logStatus,
          openedAt: new Date(),
          closedAt: logStatus === 'Closed' ? new Date() : null
        },
        include: {
          vehicle: {
            select: {
              regNumber: true,
              name: true,
              status: true
            }
          }
        }
      });

      // If status is Open, set vehicle status to "In Shop"
      if (logStatus === 'Open') {
        await tx.vehicle.update({
          where: { id: parsedVehicleId },
          data: { status: 'In Shop' }
        });
      }

      return newLog;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create maintenance log error:', error);
    res.status(500).json({ error: 'Internal server error creating maintenance log.' });
  }
});

// POST /api/maintenance/:id/close
// Only fleet_manager can close maintenance logs
router.post('/:id/close', authenticateToken, requireRole(['fleet_manager']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid maintenance log ID.' });
    }

    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true }
    });

    if (!log) {
      return res.status(404).json({ error: 'Maintenance log not found.' });
    }

    if (log.status === 'Closed') {
      return res.status(400).json({ error: 'Maintenance log is already closed.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Close the maintenance log
      const updatedLog = await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: 'Closed',
          closedAt: new Date()
        },
        include: {
          vehicle: {
            select: {
              regNumber: true,
              name: true,
              status: true
            }
          }
        }
      });

      // Restore vehicle status to "Available" unless it is Retired
      if (log.vehicle.status !== 'Retired') {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: 'Available' }
        });
      }

      return updatedLog;
    });

    res.json(result);
  } catch (error) {
    console.error('Close maintenance log error:', error);
    res.status(500).json({ error: 'Internal server error closing maintenance log.' });
  }
});

module.exports = router;
