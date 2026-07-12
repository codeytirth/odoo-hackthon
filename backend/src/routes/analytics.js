const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/dashboard - Get summary KPIs for dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query;

    // Build filter objects
    const vehicleWhere = {};
    if (type) vehicleWhere.type = type;
    if (status) vehicleWhere.status = status;

    // Fetch data
    const [vehicles, drivers, trips] = await Promise.all([
      prisma.vehicle.findMany({ where: vehicleWhere }),
      prisma.driver.findMany(),
      prisma.trip.findMany(),
    ]);

    const totalVehiclesCount = vehicles.length;
    const activeVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehiclesCount = vehicles.filter(v => v.status === 'In Shop').length;

    const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
    const driversOnDutyCount = drivers.filter(d => d.status === 'On Trip').length;

    const fleetUtilization = totalVehiclesCount > 0 
      ? Math.round((activeVehiclesCount / totalVehiclesCount) * 1000) / 10 
      : 0;

    res.json({
      activeVehicles: activeVehiclesCount,
      availableVehicles: availableVehiclesCount,
      vehiclesInMaintenance: maintenanceVehiclesCount,
      activeTrips: activeTripsCount,
      pendingTrips: pendingTripsCount,
      driversOnDuty: driversOnDutyCount,
      fleetUtilization,
      totalVehicles: totalVehiclesCount,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to load dashboard analytics' });
  }
});

// GET /api/analytics/reports - Get report metrics per vehicle
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    // Fetch all vehicles with their related logs
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: { where: { status: 'Completed' } },
        maintenanceLogs: true,
        fuelLogs: true,
        expenses: true,
      }
    });

    const reportData = vehicles.map(vehicle => {
      const totalFuelLiters = vehicle.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
      const totalFuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      
      // Sum maintenance logs cost (both open & closed for operational cost accuracy)
      const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      
      // Sum other general expenses
      const totalOtherExpenses = vehicle.expenses.reduce((sum, log) => sum + log.amount, 0);

      // Total operational cost
      const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

      // Total distance from completed trips
      const totalDistance = vehicle.trips.reduce((sum, trip) => sum + trip.distance, 0);

      // Fuel efficiency (km/liter)
      const fuelEfficiency = totalFuelLiters > 0 
        ? Math.round((totalDistance / totalFuelLiters) * 100) / 100 
        : 0;

      // Dynamic Revenue calculation (₹120 per kilometer completed)
      const revenue = totalDistance * 120;

      // Vehicle ROI formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      // We also subtract other operational costs (expenses) for a truer ROI.
      const roiNumerator = revenue - totalOperationalCost;
      const roi = vehicle.acquisitionCost > 0 
        ? Math.round((roiNumerator / vehicle.acquisitionCost) * 10000) / 100 // Express as a percentage %
        : 0;

      return {
        id: vehicle.id,
        regNumber: vehicle.regNumber,
        name: vehicle.name,
        type: vehicle.type,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
        totalDistance,
        totalFuelLiters,
        totalFuelCost,
        totalMaintenanceCost,
        totalOtherExpenses,
        totalOperationalCost,
        revenue,
        roi,
        fuelEfficiency,
      };
    });

    res.json({ data: reportData });
  } catch (error) {
    console.error('Report analytics error:', error);
    res.status(500).json({ error: 'Failed to load report analytics' });
  }
});

module.exports = router;
