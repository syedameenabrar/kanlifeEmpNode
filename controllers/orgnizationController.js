const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Organization = require('../models/Orgnization');
const Employee = require('../models/Employee');


// Add new Organization (Admin creates)
exports.addOrganization = async (req, res) => {
  try {
    const { name, phone, email,address, profileImage ,password } = req.body;

    // Auto-generate password (8 chars random)
    // const rawPassword = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(password, 10);

    const organization = new Organization({
      name,
      phone,
      address,
      profileImage,
      email: email ? email.toLowerCase() : undefined,
      password: hashedPassword,
      accountType: 'organization'
    });

    await organization.save();

    res.status(201).json({
      message: "Organization created successfully",
      organization: {
        _id: organization._id,
        name: organization.name,
        address: organization.address,
        profileImage: organization.profileImage,
        phone: organization.phone,
        email: organization.email,
        accountType: organization.accountType,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// organization login (email OR phone + password)
exports.loginOrganization = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    let query;
    if (identifier.includes('@')) {
      query = { email: identifier.toLowerCase() };
    } else {
      query = { phone: identifier };
    }

    const organization = await Organization.findOne(query);

    if (!organization) {
      return res.status(400).json({ error: "Organization not found" });
    }

    const isMatch = await bcrypt.compare(password, organization.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: organization._id, accountType: organization.accountType },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: organization._id,
        name: organization.name,
        phone: organization.phone,
        email: organization.email,
        accountType: organization.accountType,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all organization
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.status(200).json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error while fetching organizations' });
  }
};

// Get single organization by ID
exports.getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Server error while fetching organization' });
  }
};

// Update organization
exports.updateOrganization = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
  
      const updatedOrganization = await Organization.findByIdAndUpdate(id, updates, { new: true });
  
      if (!updatedOrganization) return res.status(404).json({ error: 'Organization not found' });
  
      res.json({ message: 'Organization updated successfully', organization: updatedOrganization });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Get employees linked to a specific organization
  exports.getEmployeesByOrganization = async (req, res) => {
    try {
      const { orgId } = req.params; // pass organizationId in URL
  
      // Check if org exists
      const org = await Organization.findById(orgId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
  
      // Find employees linked to this org
      const employees = await Employee.find({ organizationId: orgId })
        .populate("ppeEquipmentId"); // optional: include org details
  
      res.status(200).json({
        organization: org.name,
        employees
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Server error while fetching employees" });
    }
  };










//   If you want all orgs with employees inside each org, you can do:
exports.getAllOrganizationsWithEmployees = async (req, res) => {
    try {
      const organizations = await Organization.find();
  
      const result = await Promise.all(
        organizations.map(async (org) => {
          const employees = await Employee.find({ organizationId: org._id })
            .populate("ppeEquipmentId"); // optional if you want PPE details
  
          return {
            ...org.toObject(),
            employees
          };
        })
      );
  
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching organizations with employees:", error);
      res.status(500).json({ message: "Server error while fetching organizations" });
    }
  };
  