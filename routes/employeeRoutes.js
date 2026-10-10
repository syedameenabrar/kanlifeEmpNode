const express = require('express');
const { addEmployee, loginEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const router = express.Router();

// Admin adds employee
router.post('/add', addEmployee);

// Employee login
router.post('/login', loginEmployee);

// GET all employees
router.get('/', getAllEmployees);

// GET single employee by ID
router.get('/:id', getEmployeeById);

// ✅ Update employee (use PUT or PATCH, not POST)
router.put('/:id', updateEmployee);

// Delete employee
router.delete('/:id', deleteEmployee);




module.exports = router;
