import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();
const db_url=process.env.MONGODB_URI || "mongodb+srv://abhishektiwarirt39:Abhi1234@cluster0.fjztz10.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0/EBook"
const createSuperAdmin = async () => {
    console.log(db_url);
    
  try {
    await mongoose.connect(db_url);
    
    const superAdmin = new Admin({
      username: 'superadmin',
      email: 'admin@yourdomain.com',
      password: 'Admin@12345', // Change this!
      name: 'Super Admin',
      role: 'super_admin',
    });
    
    await superAdmin.save();
    console.log('Super Admin created successfully!');
    console.log('Username: superadmin');
    console.log('Password: Admin@123');
    console.log('PLEASE CHANGE THE PASSWORD IMMEDIATELY!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createSuperAdmin();