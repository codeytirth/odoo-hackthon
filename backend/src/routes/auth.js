const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey-transitops-8hr-hackathon-2026';

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    const validRoles = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid user role.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /auth/seed
// Creates initial users and vehicles to facilitate testing/demoing
router.post('/seed', async (req, res) => {
  try {
    const roles = [
      { email: 'manager@transitops.com', role: 'fleet_manager', password: 'password123' },
      { email: 'driver@transitops.com', role: 'driver', password: 'password123' },
      { email: 'safety@transitops.com', role: 'safety_officer', password: 'password123' },
      { email: 'finance@transitops.com', role: 'financial_analyst', password: 'password123' }
    ];

    const seededUsers = [];

    for (const u of roles) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        const created = await prisma.user.create({
          data: {
            email: u.email,
            passwordHash: hash,
            role: u.role
          }
        });
        seededUsers.push({ id: created.id, email: created.email, role: created.role });
      } else {
        seededUsers.push({ id: existing.id, email: existing.email, role: existing.role, status: 'Already Exists' });
      }
    }

    const defaultVehicles = [
      { regNumber: 'VAN-05', name: 'Delivery Van 05', type: 'Van', maxLoad: 500.0, odometer: 15000.0, acquisitionCost: 25000.0, status: 'Available' },
      { regNumber: 'TRUCK-01', name: 'Heavy Cargo Truck 01', type: 'Truck', maxLoad: 5000.0, odometer: 42000.0, acquisitionCost: 75000.0, status: 'Available' },
      { regNumber: 'VAN-12', name: 'Sprinter Van 12', type: 'Van', maxLoad: 800.0, odometer: 8500.0, acquisitionCost: 32000.0, status: 'In Shop' }
    ];

    const seededVehicles = [];
    for (const v of defaultVehicles) {
      const existing = await prisma.vehicle.findUnique({ where: { regNumber: v.regNumber } });
      if (!existing) {
        const created = await prisma.vehicle.create({ data: v });
        seededVehicles.push(created);
      } else {
        seededVehicles.push({ ...existing, status: 'Already Exists' });
      }
    }

    res.json({
      message: 'Database seeded successfully',
      users: seededUsers,
      vehicles: seededVehicles
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ error: 'Internal server error during seeding.' });
  }
});

module.exports = router;
