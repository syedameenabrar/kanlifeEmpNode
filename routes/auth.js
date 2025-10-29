// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');       // Admins
const Employee = require('../models/Employee'); // Employees
const Organization = require('../models/Orgnization'); // Organization

const router = express.Router();

// ✅ Admin Signup
router.post('/admin/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      accountType: 'admin'
    });

    await admin.save();
    res.json({ message: 'Admin created successfully', admin });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Admin adds Employee
router.post('/admin/add-employee', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      name,
      email,
      phone,
      password: hashedPassword,
      accountType: 'employee'
    });

    await employee.save();
    res.json({ message: 'Employee added successfully', employee });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Common Login (Admin or Employee)
// ✅ Common Login (Admin or Employee)

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = phone or email
    let user;

    // Detect whether input is phone or email
    const query = /^\d+$/.test(identifier)
      ? { phone: identifier }
      : { email: identifier };

    // 1️⃣ Try Admin
    user = await User.findOne(query);

    // 2️⃣ Try Employee
    if (!user) {
      user = await Employee.findOne(query);
    }

    // 3️⃣ Try Organization
    if (!user) {
      user = await Organization.findOne(query);
    }

    console.log("user",user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check password
    if (!user.password) {
      return res.status(400).json({ error: 'Password not set for this user' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("isMatch",isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check organization status if needed
    if (user?.accountType === 'organization' && user?.status && user?.status !== 'active') {
      return res.status(403).json({ error: 'Organization is inactive' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user?._id, accountType: user?.accountType },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    console.log("userrr", user)
    // Normalize response
    const userResponse = {
      _id: user?._id,
      name: user?.name,
      email: user?.email || null,
      phone: user?.phone || null,
      accountType: user?.accountType,
      profileImage: user?.profileImage || null,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
      organizationId: user?.organizationId,
      organizationName: user?.organizationName,
      ppeEquipmentSlNo: user?.ppeEquipmentSlNo,
      ppeEquipmentId: user?.ppeEquipmentId,
      ppeEquipmentType: user?.ppeEquipmentType

    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
