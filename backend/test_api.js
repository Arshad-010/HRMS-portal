import mongoose from 'mongoose';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
async function cleanData() {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.collection('leaves').deleteMany({});
  await mongoose.connection.collection('tasks').deleteMany({});
  console.log('Cleaned test leaves and tasks');
  process.exit(0);
}
cleanData();
