const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { id: 'asc' }
    });
    res.json({ data: vehicles });
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Internal server error fetching vehicles.' });
  }
});

// GET /vehicles/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Fetch vehicle error:', error);
    res.status(500).json({ error: 'Internal server error fetching vehicle.' });
  }
});

// POST /vehicles
router.post('/', authenticateToken, requireRole(['fleet_manager']), async (req, res) => {
  try {
    const { regNumber, name, type, maxLoad, odometer, acquisitionCost, status } = req.body;

    if (!regNumber || !name || !type || maxLoad === undefined || odometer === undefined || acquisitionCost === undefined) {
      return res.status(400).json({ error: 'All fields (regNumber, name, type, maxLoad, odometer, acquisitionCost) are required.' });
    }

    const existing = await prisma.vehicle.findUnique({
      where: { regNumber: regNumber.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({ error: 'Registration number already exists.' });
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        regNumber: regNumber.toUpperCase(),
        name,
        type,
        maxLoad: parseFloat(maxLoad),
        odometer: parseFloat(odometer),
        acquisitionCost: parseFloat(acquisitionCost),
        status: status || 'Available'
      }
    });

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error creating vehicle.' });
  }
});

// PUT /vehicles/:id
router.put('/:id', authenticateToken, requireRole(['fleet_manager']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    const { regNumber, name, type, maxLoad, odometer, acquisitionCost, status } = req.body;

    const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    if (regNumber && regNumber.toUpperCase() !== existingVehicle.regNumber) {
      const duplicate = await prisma.vehicle.findUnique({
        where: { regNumber: regNumber.toUpperCase() }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Registration number already exists.' });
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        regNumber: regNumber ? regNumber.toUpperCase() : undefined,
        name,
        type,
        maxLoad: maxLoad !== undefined ? parseFloat(maxLoad) : undefined,
        odometer: odometer !== undefined ? parseFloat(odometer) : undefined,
        acquisitionCost: acquisitionCost !== undefined ? parseFloat(acquisitionCost) : undefined,
        status: status || undefined
      }
    });

    res.json(updatedVehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error updating vehicle.' });
  }
});

// DELETE /vehicles/:id
router.delete('/:id', authenticateToken, requireRole(['fleet_manager']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    await prisma.vehicle.delete({ where: { id } });

    res.json({ message: 'Vehicle deleted successfully.', id });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error deleting vehicle. It might have linked trips or logs.' });
  }
});

module.exports = router;
