✅ API Endpoints

Create Admin

POST /api/auth/admin/signup
{
  "name": "Super Admin",
  "phone": "9341554015",
  "password": "Kanlife@2021"
}

Create Organization

POST /api/auth/organization/signup
{
  "name": "Shikshalokam",
  "email" : "shiksha@gmail.com",
  "phone": "9898989898",
  "password": "hA$YH8SW"
}


Create equipment

POST /api/equipment
{
  "name": "Shikshalokam",
  "email" : "shiksha@gmail.com",
  "phone": "9898989898",
  "password": "hA$YH8SW"
}

Admin Adds Employee

POST /api/auth/admin/add-employee
{
  "name": "John Doe",
  "phone": "9876543210",
  "password": "emp123"
}


Login (with email or phone)

POST /api/auth/login
{
  "identifier": "9535640137",  // OR "john@example.com"
  "password": "oRqVeLzl"
}