const express = require('express');
const { addOrganization, loginOrganization, getAllOrganizations, getOrganizationById, updateOrganization, getEmployeesByOrganization, getAllOrganizationsWithEmployees } = require('../controllers/orgnizationController');
const router = express.Router();


// ✅ Route to get all organizations + their employees
router.get('/with-employees', getAllOrganizationsWithEmployees);


// Admin adds Organization
router.post('/add', addOrganization);

// Organization login
router.post('/login', loginOrganization);

// GET all Organizations
router.get('/', getAllOrganizations);

// GET single Organization by ID
router.get('/:id', getOrganizationById);

// ✅ Update Organization (use PUT or PATCH, not POST)
router.put('/:id', updateOrganization);

router.get('/:orgId/employees', getEmployeesByOrganization)





module.exports = router;
