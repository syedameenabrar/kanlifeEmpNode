// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeesRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendance');
const organizationRoutes = require('./routes/organizationRoutes');
const PpeEquipmentsRoutes = require('./routes/ppeEquipmentsRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');






const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/equipment', PpeEquipmentsRoutes);
app.use('/api/schedule', scheduleRoutes);




mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://dhanya:dhanya@cluster0.iktawl0.mongodb.net/kanlifeEmp')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error(err));
