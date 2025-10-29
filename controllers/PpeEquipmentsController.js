const PpeEquipments = require('../models/PpeEquipments');

// Add new PpeEquipment (Admin creates)
exports.addPpeEquipment = async (req, res) => {
  try {
    const { type, slNo, refferenceName } = req.body;

    const ppeEquipment = new PpeEquipments({
        type,
        slNo,
        refferenceName,
    });

    await ppeEquipment.save();

    res.status(201).json({
      message: "Ppe Equipment created successfully",
      PpeEquipment: {
        _id: ppeEquipment._id,
        type: ppeEquipment.type,
        slNo: ppeEquipment.slNo,
        refferenceName: ppeEquipment.refferenceName
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all PpeEquipments
exports.getAllPpeEquipments = async (req, res) => {
  try {
    const ppeEquipments = await PpeEquipments.find();
    res.status(200).json(ppeEquipments);
  } catch (error) {
    console.error('Error fetching Ppe Equipments:', error);
    res.status(500).json({ message: 'Server error while fetching Ppe Equipments' });
  }
};

// Get single ppeEquipment by ID
exports.getPpeEquipmentById = async (req, res) => {
  try {
    const ppeEquipment = await PpeEquipments.findById(req.params.id);

    if (!ppeEquipment) {
      return res.status(404).json({ message: 'Ppe Equipment not found' });
    }

    res.status(200).json(ppeEquipment);
  } catch (error) {
    console.error('Error fetching ppeEquipment:', error);
    res.status(500).json({ message: 'Server error while fetching Ppe Equipment' });
  }
};

// Update PpeEquipment
exports.updatePpeEquipment = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const updatedPpeEquipment = await PpeEquipments.findByIdAndUpdate(id, updates, { new: true });
  
      if (!updatedPpeEquipment) return res.status(404).json({ error: 'Ppe Equipment not found' });
  
      res.json({ message: 'Ppe Equipment updated successfully', PpeEquipment: updatedPpeEquipment });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
