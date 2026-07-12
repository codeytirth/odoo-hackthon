const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const maintenanceRoutes = require('./routes/maintenance');
const fuelLogRoutes = require('./routes/fuelLogs');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Base health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Register routers under /api
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/expenses', expenseRoutes);

const prisma = require('./prisma');
const { authenticateToken } = require('./middleware/auth');

// GET /api/vehicles/:id/costs (Helper for Reports & Analytics)
app.get('/api/vehicles/:id/costs', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vehicle ID.' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    // Sum fuel cost
    const fuelSum = await prisma.fuelLog.aggregate({
      where: { vehicleId: id },
      _sum: { cost: true }
    });

    // Sum maintenance cost
    const maintenanceSum = await prisma.maintenanceLog.aggregate({
      where: { vehicleId: id },
      _sum: { cost: true }
    });

    // Sum other expenses
    const expenseSum = await prisma.expense.aggregate({
      where: { vehicleId: id },
      _sum: { amount: true }
    });

    const totalFuelCost = fuelSum._sum.cost || 0;
    const totalMaintenanceCost = maintenanceSum._sum.cost || 0;
    const totalExpenseCost = expenseSum._sum.amount || 0;
    const totalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;

    res.json({
      vehicleId: id,
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
      totalCost
    });
  } catch (error) {
    console.error('Fetch vehicle costs error:', error);
    res.status(500).json({ error: 'Internal server error calculating vehicle costs.' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`TransitOps Backend running on port ${PORT}`);
});
