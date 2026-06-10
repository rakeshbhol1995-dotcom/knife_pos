import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Models
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';
import Expense from './models/Expense.js';
import Staff from './models/Staff.js';
import Inquiry from './models/Inquiry.js';
import ChatMessage from './models/ChatMessage.js';
import Complaint from './models/Complaint.js';
import Salary from './models/Salary.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petpooja';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    seedDatabase();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Socket.io room connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Client joins a room specific to their restaurant ID
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(restaurantId);
    console.log(`Socket ${socket.id} joined room: ${restaurantId}`);
  });

  // Support Chat Sockets
  socket.on('join_support', (restaurantId) => {
    socket.join(`support_${restaurantId}`);
    console.log(`Socket ${socket.id} joined support room: support_${restaurantId}`);
  });

  socket.on('join_admin_support', () => {
    socket.join('admin_support_room');
    console.log(`Socket ${socket.id} joined admin support room`);
  });

  socket.on('send_support_message', async (data) => {
    try {
      const { restaurantId, message } = data;
      const newMsg = new ChatMessage({
        restaurantId,
        sender: 'restaurant',
        message
      });
      await newMsg.save();
      
      // Broadcast to room
      io.to(`support_${restaurantId}`).emit('new_support_message', newMsg);
      // Notify admin
      io.to('admin_support_room').emit('admin_support_notification', newMsg);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('send_admin_reply', async (data) => {
    try {
      const { restaurantId, message } = data;
      const newMsg = new ChatMessage({
        restaurantId,
        sender: 'admin',
        message
      });
      await newMsg.save();
      
      // Broadcast to room
      io.to(`support_${restaurantId}`).emit('new_support_message', newMsg);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- API ROUTES ---

// 1. Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const inputUser = username.trim().toLowerCase();

    // System Administrator check
    if (inputUser === 'admin' && password === 'admin') {
      return res.json({
        success: true,
        user: { username: 'admin', name: 'System Administrator', role: 'admin' }
      });
    }

    // Restaurant login check
    const restaurant = await Restaurant.findOne({ username: username.trim() });
    if (!restaurant) {
      return res.status(401).json({ success: false, message: 'Invalid username or password!' });
    }

    if (restaurant.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password!' });
    }

    if (restaurant.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `"${restaurant.name}" is currently suspended. Please contact the administrator.`
      });
    }

    // Trial Expiry Check
    if (restaurant.expiryDate && new Date() > new Date(restaurant.expiryDate)) {
      return res.status(403).json({
        success: false,
        message: `Your 1-year free trial for "${restaurant.name}" has expired on ${new Date(restaurant.expiryDate).toLocaleDateString('en-IN')}. Please contact system administrator to renew.`
      });
    }

    res.json({
      success: true,
      user: {
        username: restaurant.username,
        name: restaurant.owner,
        role: 'restaurant',
        restaurantId: restaurant.id
      },
      restaurant
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to generate unique 6-digit support ID
async function generateUniqueId() {
  let uniqueId;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 100) {
    uniqueId = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const dup = await Restaurant.findOne({ uniqueId });
    if (!dup) {
      isUnique = true;
    }
    attempts++;
  }
  return uniqueId;
}

// 2. Restaurant / Outlet Routes
app.get('/api/restaurants', async (req, res) => {
  try {
    const list = await Restaurant.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/restaurants', async (req, res) => {
  try {
    const { id, name, owner, phone, cuisine, currency, taxRate, username, password } = req.body;
    
    // Check if duplicate slug exists
    const duplicate = await Restaurant.findOne({ id });
    if (duplicate) {
      return res.status(400).json({ message: 'Restaurant name is too similar to an existing one.' });
    }

    const uniqueId = await generateUniqueId();
    const onboardedAt = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(onboardedAt.getFullYear() + 1);

    const newRest = new Restaurant({
      id,
      uniqueId,
      phone,
      name,
      owner,
      cuisine: cuisine || 'Multi-Cuisine',
      currency: currency || '₹',
      taxRate: Number(taxRate) || 5,
      username,
      password,
      onboardedAt,
      expiryDate
    });

    await newRest.save();
    res.status(201).json(newRest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/restaurants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Closed'
    const updated = await Restaurant.findOneAndUpdate({ id }, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/restaurants/:id/credentials', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    const updated = await Restaurant.findOneAndUpdate({ id }, { username, password }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Menu Item Routes
app.get('/api/menu/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const items = await MenuItem.find({ restaurantId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/menu/item/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'In Stock' or 'Out of Stock'
    const updated = await MenuItem.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { restaurantId, name, price, category, type, status } = req.body;
    const newItem = new MenuItem({
      restaurantId,
      name,
      price: Number(price),
      category,
      type,
      status: status || 'In Stock'
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/menu/batch', async (req, res) => {
  try {
    const { restaurantId, items } = req.body;
    const formattedItems = items.map(item => ({
      restaurantId,
      name: item.name,
      price: Number(item.price),
      category: item.category,
      type: item.type,
      status: item.status || 'In Stock'
    }));
    const newItems = await MenuItem.insertMany(formattedItems);
    res.status(201).json(newItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Order Routes
app.get('/api/orders/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body; // Includes restaurantId, total, items, table, orderType, etc.
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Broadcast new order to connected client screens for this restaurant
    io.to(orderData.restaurantId).emit('order_created', newOrder);

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Try to find by custom id first, otherwise findById
    let updatedOrder = await Order.findOneAndUpdate({ id }, { status }, { new: true });
    if (!updatedOrder && mongoose.Types.ObjectId.isValid(id)) {
      updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    }

    if (updatedOrder) {
      // Broadcast status update
      io.to(updatedOrder.restaurantId).emit('order_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Expenses Routes
app.get('/api/expenses/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const expenses = await Expense.find({ restaurantId }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expenseData = req.body;
    const newExpense = new Expense(expenseData);
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await Expense.findOneAndDelete({ id });
    if (!deleted && mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Expense.findByIdAndDelete(id);
    }
    if (!deleted) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Staff Routes
app.get('/api/staff/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const staffList = await Staff.find({ restaurantId });
    res.json(staffList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const staffData = req.body;
    const newStaff = new Staff(staffData);
    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await Staff.findOneAndDelete({ id });
    if (!deleted && mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Staff.findByIdAndDelete(id);
    }
    if (!deleted) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    let updated = await Staff.findOneAndUpdate({ id }, updateData, { new: true });
    if (!updated && mongoose.Types.ObjectId.isValid(id)) {
      updated = await Staff.findByIdAndUpdate(id, updateData, { new: true });
    }
    if (!updated) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Salary Payments Routes
app.get('/api/salaries/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const salaries = await Salary.find({ restaurantId });
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/salaries', async (req, res) => {
  try {
    const salaryData = req.body;
    const updated = await Salary.findOneAndUpdate(
      { paidKey: salaryData.paidKey },
      salaryData,
      { upsert: true, new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Contact / Inquiry Route (Book a Call)
app.post('/api/contact', async (req, res) => {
  try {
    const { restaurantName, restaurantAddress, ownerName, ownerPhone } = req.body;
    if (!restaurantName || !restaurantAddress || !ownerName || !ownerPhone) {
      return res.status(400).json({ success: false, message: 'Please fill out all required fields!' });
    }
    const newInquiry = new Inquiry({ restaurantName, restaurantAddress, ownerName, ownerPhone });
    await newInquiry.save();
    res.status(201).json({ success: true, message: 'Thank you! Your call has been booked. We will get in touch with you shortly.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/inquiries', async (req, res) => {
  try {
    const list = await Inquiry.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/inquiries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Contacted', 'Closed'
    const updated = await Inquiry.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. Support Chat Routes
app.get('/api/chat/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const history = await ChatMessage.find({ restaurantId }).sort({ createdAt: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. Complaints Routes
app.post('/api/complaints', async (req, res) => {
  try {
    const { restaurantId, restaurantName, subject, description } = req.body;
    if (!restaurantId || !restaurantName || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Missing required complaint parameters' });
    }
    const newComplaint = new Complaint({ restaurantId, restaurantName, subject, description });
    await newComplaint.save();
    res.status(201).json({ success: true, message: 'Complaint submitted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const list = await Complaint.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/complaints/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Resolved'
    const updateData = { status };
    if (status === 'Resolved') {
      updateData.resolvedAt = new Date();
    }
    const updated = await Complaint.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- DATABASE SEEDER LOGIC ---
async function seedDatabase() {
  try {
    // 1. Check if Urmi Kitchen default exists
    const urmi = await Restaurant.findOne({ id: 'urmi_kitchen' });
    if (urmi) {
      let updated = false;
      if (!urmi.expiryDate) {
        console.log('Migrating default Urmi Kitchen trial dates...');
        const onboardedAt = urmi.createdAt || new Date();
        const expiryDate = new Date(onboardedAt);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        urmi.onboardedAt = onboardedAt;
        urmi.expiryDate = expiryDate;
        updated = true;
      }
      if (!urmi.uniqueId) {
        urmi.uniqueId = 100101;
        updated = true;
      }
      if (!urmi.phone) {
        urmi.phone = '9861234567';
        updated = true;
      }
      if (updated) {
        await urmi.save();
      }
    }

    if (!urmi) {
      console.log('Seeding default Urmi Kitchen restaurant...');
      const onboardedAt = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(onboardedAt.getFullYear() + 1);

      const defaultUrmi = new Restaurant({
        id: 'urmi_kitchen',
        uniqueId: 100101,
        phone: '9861234567',
        name: 'Urmi Kitchen',
        owner: 'Bunty',
        cuisine: 'North Indian & Biryani',
        status: 'Active',
        taxRate: 5,
        currency: '₹',
        username: 'urmi',
        password: 'urmi123',
        onboardedAt,
        expiryDate
      });
      await defaultUrmi.save();

      // Seed menu items
      console.log('Seeding initial menu items...');
      const INITIAL_MENU_ITEMS = [
        { name: "Tomato Soup", price: 120, category: "Soups", type: "Veg", restaurantId: 'urmi_kitchen' },
        { name: "Sweet Corn Veg Soup", price: 87, category: "Soups", type: "Veg", restaurantId: 'urmi_kitchen' },
        { name: "Sweet Corn Chicken Soup", price: 206, category: "Soups", type: "Non-Veg", restaurantId: 'urmi_kitchen' },
        { name: "Mutton Paya Soup", price: 308, category: "Soups", type: "Non-Veg", restaurantId: 'urmi_kitchen' },
        { name: "Paneer Tikka", price: 177, category: "Veg Starters", type: "Veg", restaurantId: 'urmi_kitchen' },
        { name: "Paneer Chilli", price: 214, category: "Veg Starters", type: "Veg", restaurantId: 'urmi_kitchen' },
        { name: "Chicken Tikka", price: 288, category: "Chicken Starters", type: "Non-Veg", restaurantId: 'urmi_kitchen' },
        { name: "Chicken 65", price: 277, category: "Chicken Starters", type: "Non-Veg", restaurantId: 'urmi_kitchen' },
        { name: "Butter Naan", price: 60, category: "Breads / Roti", type: "Veg", restaurantId: 'urmi_kitchen' },
        { name: "Tandoori Roti", price: 30, category: "Breads / Roti", type: "Veg", restaurantId: 'urmi_kitchen' },
        { name: "Chicken Biryani", price: 335, category: "Rice & Biryani", type: "Non-Veg", restaurantId: 'urmi_kitchen' },
        { name: "Veg Fried Rice", price: 171, category: "Noodles & Fried Rice", type: "Veg", restaurantId: 'urmi_kitchen' }
      ];
      await MenuItem.insertMany(INITIAL_MENU_ITEMS);

      // Seed initial staff
      console.log('Seeding initial staff...');
      const INITIAL_STAFF = [
        { id: 'ST-001', name: 'Hari Mishra', role: 'Head Chef', salary: 18000, contact: '9861234567', status: 'Active', joined: '2025-01-10', restaurantId: 'urmi_kitchen' },
        { id: 'ST-002', name: 'Raju Pradhan', role: 'Kitchen Helper', salary: 12000, contact: '7008123456', status: 'Active', joined: '2025-03-15', restaurantId: 'urmi_kitchen' },
        { id: 'ST-003', name: 'Sanjay Sahoo', role: 'Waiter', salary: 9000, contact: '9437123456', status: 'Active', joined: '2025-04-01', restaurantId: 'urmi_kitchen' }
      ];
      await Staff.insertMany(INITIAL_STAFF);

      // Seed initial expenses
      console.log('Seeding initial expenses...');
      const INITIAL_EXPENSES = [
        { id: 'EXP-001', title: 'Weekly Vegetables & Groceries', amount: 3500, category: 'Raw Materials', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'Bought from wholesale market', restaurantId: 'urmi_kitchen' },
        { id: 'EXP-002', title: 'Monthly Shop Rent', amount: 15000, category: 'Rent', date: new Date().toISOString().substring(0, 7) + '-01', notes: 'Paid to landlord', restaurantId: 'urmi_kitchen' },
        { id: 'EXP-003', title: 'Electricity Bill', amount: 4800, category: 'Utilities', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'TPCODL online payment', restaurantId: 'urmi_kitchen' }
      ];
      await Expense.insertMany(INITIAL_EXPENSES);

      // Seed mock orders
      console.log('Seeding initial orders...');
      const seedOrders = [
        {
          id: '#ORD-001',
          table: 'T-1',
          customerName: 'Guest Customer',
          customerPhone: '9999999999',
          customerAddress: '',
          paymentMode: 'Cash',
          orderType: 'Dine In',
          items: [
            { name: 'Chicken Biryani', price: 335, quantity: 2, type: 'Non-Veg', category: 'Rice & Biryani' },
            { name: 'Tomato Soup', price: 120, quantity: 1, type: 'Veg', category: 'Soups' }
          ],
          status: 'Ready',
          total: 830,
          time: '01:30 PM',
          date: new Date().toLocaleDateString('en-IN'),
          restaurantId: 'urmi_kitchen'
        },
        {
          id: '#ORD-002',
          table: 'T-2',
          customerName: 'Guest Customer',
          customerPhone: '9999999999',
          customerAddress: '',
          paymentMode: 'UPI',
          orderType: 'Dine In',
          items: [
            { name: 'Paneer Tikka', price: 177, quantity: 1, type: 'Veg', category: 'Veg Starters' },
            { name: 'Butter Naan', price: 60, quantity: 2, type: 'Veg', category: 'Breads / Roti' }
          ],
          status: 'Ready',
          total: 312,
          time: '02:15 PM',
          date: new Date().toLocaleDateString('en-IN'),
          restaurantId: 'urmi_kitchen'
        }
      ];
      await Order.insertMany(seedOrders);
    }

    // Ensure all existing restaurants have a unique numerical ID and default phone number if missing
    const allRests = await Restaurant.find();
    for (const rest of allRests) {
      let updated = false;
      if (!rest.uniqueId) {
        let uniqueId;
        let isUnique = false;
        while (!isUnique) {
          uniqueId = Math.floor(100000 + Math.random() * 900000);
          const dup = await Restaurant.findOne({ uniqueId });
          if (!dup) isUnique = true;
        }
        rest.uniqueId = uniqueId;
        updated = true;
      }
      if (!rest.phone) {
        rest.phone = '9861234567';
        updated = true;
      }
      if (updated) {
        await rest.save();
        console.log(`Migrated restaurant ${rest.name}: uniqueId=${rest.uniqueId}, phone=${rest.phone}`);
      }
    }

    console.log('Database seeding completed!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// Start HTTP Server
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
