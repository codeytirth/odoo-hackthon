const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/drivers - List all drivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const driversList = await prisma.driver.findMany({
      orderBy: { id: 'desc' },
    });
    res.json({ data: driversList });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const driverId = parseInt(req.params.id);
  if (isNaN(driverId)) {
    return res.status(400).json({ error: 'Invalid driver ID' });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// POST /api/drivers - Create a new driver (restricted to fleet_manager and safety_officer)
router.post('/', authenticateToken, requireRole(['fleet_manager', 'safety_officer']), async (req, res) => {
  const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } = req.body;

  // Validation
  if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contact) {
    return res.status(400).json({ error: 'Missing required driver profile fields' });
  }

  const parsedExpiry = new Date(licenseExpiry);
  if (isNaN(parsedExpiry.getTime())) {
    return res.status(400).json({ error: 'Invalid license expiry date format' });
  }

  const parsedScore = parseFloat(safetyScore);
  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return res.status(400).json({ error: 'Safety score must be a number between 0 and 100' });
  }

  const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
  const driverStatus = status || 'Available';
  if (!validStatuses.includes(driverStatus)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const newDriver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiry: parsedExpiry,
        contact,
        safetyScore: parsedScore,
        status: driverStatus,
      },
    });

    res.status(201).json(newDriver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// PUT /api/drivers/:id - Update an existing driver (restricted to fleet_manager and safety_officer)
router.put('/:id', authenticateToken, requireRole(['fleet_manager', 'safety_officer']), async (req, res) => {
  const driverId = parseInt(req.params.id);
  if (isNaN(driverId)) {
    return res.status(400).json({ error: 'Invalid driver ID' });
  }

  const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } = req.body;

  try {
    // Check if driver exists
    const driverExists = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driverExists) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (licenseCategory !== undefined) updateData.licenseCategory = licenseCategory;
    
    if (licenseExpiry !== undefined) {
      const parsedExpiry = new Date(licenseExpiry);
      if (isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({ error: 'Invalid license expiry date format' });
      }
      updateData.licenseExpiry = parsedExpiry;
    }

    if (contact !== undefined) updateData.contact = contact;

    if (safetyScore !== undefined) {
      const parsedScore = parseFloat(safetyScore);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
        return res.status(400).json({ error: 'Safety score must be a number between 0 and 100' });
      }
      updateData.safetyScore = parsedScore;
    }

    if (status !== undefined) {
      const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      updateData.status = status;
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// DELETE /api/drivers/:id - Delete a driver (restricted to fleet_manager and safety_officer)
router.delete('/:id', authenticateToken, requireRole(['fleet_manager', 'safety_officer']), async (req, res) => {
  const driverId = parseInt(req.params.id);
  if (isNaN(driverId)) {
    return res.status(400).json({ error: 'Invalid driver ID' });
  }

  try {
    const driverExists = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driverExists) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if the driver is currently assigned to a dispatched or active trip
    const activeTrips = await prisma.trip.findFirst({
      where: {
        driverId: driverId,
        status: 'Dispatched',
      },
    });

    if (activeTrips) {
      return res.status(400).json({ error: 'Cannot delete driver currently assigned to an active trip' });
    }

    await prisma.driver.delete({
      where: { id: driverId },
    });

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

module.exports = router;
