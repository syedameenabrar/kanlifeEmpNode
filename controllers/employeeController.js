const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Add new employee (Admin creates)
exports.addEmployee = async (req, res) => {
  try {
    const { name, phone, email, password, empType, organizationId, ppeEquipmentId, ppeEquipmentSlNo, organizationName , ppeEquipmentType} = req.body;

    // Auto-generate password (8 chars random)
    // const rawPassword = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      name,
      phone,
      email: email ? email.toLowerCase() : undefined,
      password: hashedPassword,
      accountType: 'employee',
      empType,
      organizationId,
      ppeEquipmentId,
      ppeEquipmentSlNo,
      ppeEquipmentType,
      organizationName
    });

    await employee.save();

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        _id: employee._id,
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        accountType: employee.accountType,
        empType: employee.empType,
        organizationId: employee.organizationId,
        ppeEquipmentId: employee.ppeEquipmentId,
        ppeEquipmentSlNo: employee.ppeEquipmentSlNo,
        ppeEquipmentType: employee.ppeEquipmentType
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Employee login (email OR phone + password)
exports.loginEmployee = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    let query;
    if (identifier.includes('@')) {
      query = { email: identifier.toLowerCase() };
    } else {
      query = { phone: identifier };
    }

    const employee = await Employee.findOne(query);

    if (!employee) {
      return res.status(400).json({ error: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee._id, accountType: employee.accountType },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: employee._id,
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        accountType: employee.accountType,
      empType: user?.empType,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
};

// Get single employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error while fetching employee' });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
  
      const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, { new: true });
  
      if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
  
      res.json({ message: 'Employee updated successfully', employee: updatedEmployee });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
