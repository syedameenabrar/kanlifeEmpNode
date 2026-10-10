const express = require('express');
const { addPpeEquipment, getAllPpeEquipments, getPpeEquipmentById, updatePpeEquipment, deletePpeEquipment } = require('../controllers/PpeEquipmentsController');
const router = express.Router();

// Admin adds PpeEquipment
router.post('/add', addPpeEquipment);

// GET all PpeEquipments
router.get('/', getAllPpeEquipments);

// GET single PpeEquipment by ID
router.get('/:id', getPpeEquipmentById);

// ✅ Update PpeEquipment (use PUT or PATCH, not POST)
router.put('/:id', updatePpeEquipment);

// Delete PpeEquipment
router.delete('/:id', deletePpeEquipment);




module.exports = router;
