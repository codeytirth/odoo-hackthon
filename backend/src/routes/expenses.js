const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses
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

    const expenses = await prisma.expense.findMany({
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

    res.json({ data: expenses });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Internal server error fetching expenses.' });
  }
});

// POST /api/expenses
router.post('/', authenticateToken, requireRole(['fleet_manager', 'financial_analyst']), async (req, res) => {
  try {
    const { vehicleId, type, amount, date } = req.body;

    if (vehicleId === undefined || !type || amount === undefined || !date) {
      return res.status(400).json({ error: 'vehicleId, type, amount, and date are required.' });
    }

    const parsedVehicleId = parseInt(vehicleId);
    const parsedAmount = parseFloat(amount);
    const parsedDate = new Date(date);

    if (isNaN(parsedVehicleId)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    if (!type.trim()) {
      return res.status(400).json({ error: 'Expense type cannot be empty.' });
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
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

    const newExpense = await prisma.expense.create({
      data: {
        vehicleId: parsedVehicleId,
        type: type.trim(),
        amount: parsedAmount,
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

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error creating expense.' });
  }
});

module.exports = router;
