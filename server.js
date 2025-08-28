
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mitheralfx-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Persistent data storage using JSON files
let users = [];
let trades = [];
let deposits = [];
let withdrawals = [];
let news = [];
let calendar = [];
let notifications = [];

// Data file paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const DEPOSITS_FILE = path.join(DATA_DIR, 'deposits.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Save data to files
async function saveUsers() {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

async function saveTrades() {
  try {
    await fs.writeFile(TRADES_FILE, JSON.stringify(trades, null, 2));
  } catch (error) {
    console.error('Error saving trades:', error);
  }
}

async function saveDeposits() {
  try {
    await fs.writeFile(DEPOSITS_FILE, JSON.stringify(deposits, null, 2));
  } catch (error) {
    console.error('Error saving deposits:', error);
  }
}

async function saveWithdrawals() {
  try {
    await fs.writeFile(WITHDRAWALS_FILE, JSON.stringify(withdrawals, null, 2));
  } catch (error) {
    console.error('Error saving withdrawals:', error);
  }
}

async function saveNotifications() {
  try {
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

// Load data from files
async function loadData() {
  try {
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    users = JSON.parse(usersData);
  } catch (error) {
    console.log('No users data found, starting with empty array');
    users = [];
  }

  try {
    const tradesData = await fs.readFile(TRADES_FILE, 'utf8');
    trades = JSON.parse(tradesData);
  } catch (error) {
    console.log('No trades data found, starting with empty array');
    trades = [];
  }

  try {
    const depositsData = await fs.readFile(DEPOSITS_FILE, 'utf8');
    deposits = JSON.parse(depositsData);
  } catch (error) {
    console.log('No deposits data found, starting with empty array');
    deposits = [];
  }

  try {
    const withdrawalsData = await fs.readFile(WITHDRAWALS_FILE, 'utf8');
    withdrawals = JSON.parse(withdrawalsData);
  } catch (error) {
    console.log('No withdrawals data found, starting with empty array');
    withdrawals = [];
  }

  try {
    const notificationsData = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    notifications = JSON.parse(notificationsData);
  } catch (error) {
    console.log('No notifications data found, starting with empty array');
    notifications = [];
  }
}

// Load initial data
async function loadInitialData() {
  // Ensure data directory exists
  await ensureDataDir();
  
  // Load persistent data
  await loadData();
  
  try {
    const newsData = await fs.readFile('./data/news.json', 'utf8');
    news = JSON.parse(newsData);
  } catch (error) {
    console.log('No news data found, starting with empty array');
  }

  try {
    const calendarData = await fs.readFile('./data/calendar.json', 'utf8');
    calendar = JSON.parse(calendarData);
  } catch (error) {
    console.log('No calendar data found, starting with empty array');
  }

  // Initialize demo user only if no users exist
  if (users.length === 0) {
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@mitheralfx.com',
      password: await bcrypt.hash('demo123', 10),
      firstName: 'Demo',
      lastName: 'User',
      accountType: 'demo',
      balance: {
        demo: 10000,
        live: 0
      },
      level: 'Beginner',
      vipStatus: 'Standard',
      joinDate: new Date(),
      lastLogin: new Date(),
      trades: 0,
      totalProfit: 0,
      winRate: 0,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    };
    
    users.push(demoUser);
    await saveUsers();
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType, phone, country } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      phone,
      country,
      balance: {
        demo: 10000,
        live: 0
      },
      level: 'Beginner',
      vipStatus: 'Standard',
      joinDate: new Date(),
      lastLogin: new Date(),
      trades: 0,
      totalProfit: 0,
      winRate: 0,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    };

    users.push(newUser);
    await saveUsers();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        accountType: newUser.accountType,
        balance: newUser.balance,
        level: newUser.level,
        vipStatus: newUser.vipStatus
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin credentials first
    const ADMIN_EMAIL = 'samwellmedia565@gmail.com';
    const ADMIN_PASSWORD = 'Dumks@m23';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Admin login successful
      const adminToken = jwt.sign(
        { userId: 'admin', email: ADMIN_EMAIL, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Admin login successful',
        token: adminToken,
        user: {
          id: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          email: ADMIN_EMAIL,
          accountType: 'admin',
          balance: { demo: 0, live: 0 },
          level: 'Administrator',
          vipStatus: 'Admin',
          lastLogin: new Date(),
          role: 'admin'
        },
        redirectTo: '/admin-access.html'
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await saveUsers();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        balance: user.balance,
        level: user.level,
        vipStatus: user.vipStatus,
        lastLogin: user.lastLogin
      },
      redirectTo: '/trading-dashboard.html'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// USER PROFILE ROUTES
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password, ...userProfile } = user;
  res.json(userProfile);
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates = req.body;
  delete updates.password; // Don't allow password updates through this route
  delete updates.id; // Don't allow ID changes

  // Allow balance updates but validate them
  if (updates.balance) {
    if (typeof updates.balance.demo === 'number' && updates.balance.demo >= 0) {
      users[userIndex].balance.demo = updates.balance.demo;
    }
    if (typeof updates.balance.live === 'number' && updates.balance.live >= 0) {
      users[userIndex].balance.live = updates.balance.live;
    }
    delete updates.balance; // Remove from updates after processing
  }

  users[userIndex] = { ...users[userIndex], ...updates };
  await saveUsers();
  
  const { password, ...updatedUser } = users[userIndex];
  res.json({ message: 'Profile updated successfully', user: updatedUser });
});

app.put('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[userIndex].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].password = hashedNewPassword;

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TRADING ROUTES
app.post('/api/trades/execute', authenticateToken, async (req, res) => {
  try {
    const { symbol, type, amount, leverage, accountType } = req.body;
    
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    const requiredMargin = amount / parseFloat(leverage.split(':')[1]);

    // Check if user has sufficient balance for margin
    if (user.balance[accountType] < requiredMargin) {
      return res.status(400).json({ error: 'Insufficient balance for margin requirement' });
    }

    // Create trade
    const trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      symbol,
      type, // 'buy' or 'sell'
      amount,
      leverage,
      accountType,
      openPrice: getRandomPrice(symbol),
      currentPrice: getRandomPrice(symbol),
      margin: requiredMargin,
      openTime: new Date(),
      status: 'open',
      pnl: 0
    };

    trades.push(trade);
    await saveTrades();

    // Deduct only the margin from user balance, not the full amount
    users[userIndex].balance[accountType] -= requiredMargin;
    users[userIndex].trades += 1;
    await saveUsers();

    res.json({
      message: 'Trade executed successfully',
      trade,
      balance: users[userIndex].balance
    });
  } catch (error) {
    console.error('Execute trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/trades/:tradeId/close', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    
    const tradeIndex = trades.findIndex(t => t.id === tradeId && t.userId === req.user.userId);
    if (tradeIndex === -1) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = trades[tradeIndex];
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    
    // Calculate P&L with correct formula
    const currentPrice = getRandomPrice(trade.symbol);
    const priceChangePercent = trade.type === 'buy' 
      ? (currentPrice - trade.openPrice) / trade.openPrice
      : (trade.openPrice - currentPrice) / trade.openPrice;
    
    const leverageMultiplier = parseFloat(trade.leverage.split(':')[1]);
    
    // Calculate profit/loss: Trade Amount × Price Change % × Leverage
    let pnl = trade.amount * priceChangePercent * leverageMultiplier;
    
    // Check for active admin rules
    let adminRuleApplied = false;
    try {
      // This would normally come from database, but we'll use a simple check
      // In a real implementation, you'd store rules in database and check them here
      const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
      
      // For now, apply your controlled percentages
      // You can extend this to check actual admin rules from localStorage or database
      const profitControlPercent = 0.05; // 5% of calculated profit
      const lossControlPercent = 0.02;   // 2% of calculated loss
      
      if (pnl > 0) {
        pnl = pnl * profitControlPercent; // Reduce profit to controlled level
        adminRuleApplied = true;
      } else if (pnl < 0) {
        pnl = pnl * lossControlPercent;   // Reduce loss to controlled level
        adminRuleApplied = true;
      }
    } catch (error) {
      console.log('Admin rule check failed, using default behavior');
    }

    // Update trade
    trades[tradeIndex].status = 'closed';
    trades[tradeIndex].closePrice = currentPrice;
    trades[tradeIndex].closeTime = new Date();
    trades[tradeIndex].pnl = pnl;
    await saveTrades();

    // Return margin to balance plus/minus profit/loss
    users[userIndex].balance[trade.accountType] += (trade.margin + pnl);
    users[userIndex].totalProfit += pnl;

    // Update win rate
    const userTrades = trades.filter(t => t.userId === req.user.userId && t.status === 'closed');
    const winningTrades = userTrades.filter(t => t.pnl > 0);
    users[userIndex].winRate = userTrades.length > 0 ? (winningTrades.length / userTrades.length) * 100 : 0;
    
    await saveUsers();

    res.json({
      message: 'Trade closed successfully',
      trade: trades[tradeIndex],
      balance: users[userIndex].balance,
      pnl
    });
  } catch (error) {
    console.error('Close trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/trades/history', authenticateToken, (req, res) => {
  const userTrades = trades
    .filter(t => t.userId === req.user.userId)
    .sort((a, b) => new Date(b.openTime) - new Date(a.openTime));
  
  res.json(userTrades);
});

app.get('/api/trades/open', authenticateToken, (req, res) => {
  const openTrades = trades
    .filter(t => t.userId === req.user.userId && t.status === 'open')
    .sort((a, b) => new Date(b.openTime) - new Date(a.openTime));
  
  res.json(openTrades);
});

// DEPOSIT ROUTES
app.post('/api/deposits', authenticateToken, (req, res) => {
  try {
    const { amount, method, details } = req.body;
    
    const deposit = {
      id: `deposit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      amount: parseFloat(amount),
      method,
      details,
      status: 'pending',
      date: new Date(),
      fee: amount * 0.01, // 1% fee
      bonus: calculateDepositBonus(amount)
    };

    deposits.push(deposit);

    res.json({
      message: 'Deposit request submitted successfully',
      deposit
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/deposits/history', authenticateToken, (req, res) => {
  const userDeposits = deposits
    .filter(d => d.userId === req.user.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(userDeposits);
});

// WITHDRAWAL ROUTES
app.post('/api/withdrawals', authenticateToken, (req, res) => {
  try {
    const { amount, method, details } = req.body;
    
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    
    // Check if user has sufficient balance
    if (user.balance.live < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const fee = amount * 0.025; // 2.5% fee
    const netAmount = amount - fee;

    const withdrawal = {
      id: `withdrawal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      amount: parseFloat(amount),
      fee,
      netAmount,
      method,
      details,
      status: 'pending',
      date: new Date()
    };

    withdrawals.push(withdrawal);

    // Deduct from balance
    users[userIndex].balance.live -= amount;

    res.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal,
      balance: users[userIndex].balance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/withdrawals/history', authenticateToken, (req, res) => {
  const userWithdrawals = withdrawals
    .filter(w => w.userId === req.user.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(userWithdrawals);
});

// MARKET DATA ROUTES
app.get('/api/market/prices', (req, res) => {
  const prices = {
    'EUR/USD': getRandomPrice('EURUSD'),
    'GBP/USD': getRandomPrice('GBPUSD'),
    'USD/JPY': getRandomPrice('USDJPY'),
    'BTC/USD': getRandomPrice('BTCUSD'),
    'ETH/USD': getRandomPrice('ETHUSD'),
    'XAU/USD': getRandomPrice('XAUUSD'),
    'OIL': getRandomPrice('OIL'),
    'SPX500': getRandomPrice('SPX500')
  };

  res.json(prices);
});

app.get('/api/market/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  const price = getRandomPrice(symbol.toUpperCase());
  res.json({ symbol, price });
});

app.get('/api/market/news', (req, res) => {
  res.json(news);
});

app.get('/api/market/calendar', (req, res) => {
  res.json(calendar);
});

// NOTIFICATIONS ROUTES
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userNotifications = notifications
    .filter(n => n.userId === req.user.userId || n.userId === 'all')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(userNotifications);
});

app.post('/api/notifications/mark-read', authenticateToken, (req, res) => {
  const { notificationId } = req.body;
  
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
  
  res.json({ message: 'Notification marked as read' });
});

// ADMIN ROUTES (for demo purposes)
app.post('/api/admin/process-deposit', (req, res) => {
  const { depositId, status } = req.body;
  
  const depositIndex = deposits.findIndex(d => d.id === depositId);
  if (depositIndex === -1) {
    return res.status(404).json({ error: 'Deposit not found' });
  }

  deposits[depositIndex].status = status;

  if (status === 'completed') {
    const deposit = deposits[depositIndex];
    const userIndex = users.findIndex(u => u.id === deposit.userId);
    
    if (userIndex !== -1) {
      const totalCredit = deposit.amount - deposit.fee + deposit.bonus;
      users[userIndex].balance.live += totalCredit;
    }
  }

  res.json({ message: 'Deposit processed successfully' });
});

// UTILITY FUNCTIONS
function getRandomPrice(symbol) {
  const basePrices = {
    'EURUSD': 1.0500,
    'GBPUSD': 1.2800,
    'USDJPY': 150.00,
    'BTCUSD': 45000,
    'ETHUSD': 2500,
    'XAUUSD': 2000,
    'OIL': 75.00,
    'SPX500': 4500
  };

  const basePrice = basePrices[symbol] || 1.0000;
  const volatility = 0.02; // 2% volatility
  const change = (Math.random() - 0.5) * 2 * volatility;
  
  return basePrice * (1 + change);
}

function calculateDepositBonus(amount) {
  if (amount >= 5000) return amount * 1.0; // 100% bonus
  if (amount >= 1000) return amount * 0.75; // 75% bonus
  if (amount >= 500) return amount * 0.5; // 50% bonus
  if (amount >= 100) return amount * 0.25; // 25% bonus
  return 0;
}

// Serve static files first - this ensures all assets load properly
app.use(express.static(path.join(__dirname), {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// HTML route handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading-dashboard.html'));
});

app.get('/trading-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'trading-dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/admin-access.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-access.html'));
});

app.get('/admin-panel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

app.get('/Trade-History.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Trade-History.html'));
});

app.get('/charts.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'charts.html'));
});

app.get('/deposit.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'deposit.html'));
});

app.get('/withdraw.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'withdraw.html'));
});

app.get('/account.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'account.html'));
});

app.get('/level.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'level.html'));
});

app.get('/bonus.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'bonus.html'));
});

app.get('/VIP.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'VIP.html'));
});

app.get('/pro-trader.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pro-trader.html'));
});

app.get('/affilate.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'affilate.html'));
});

app.get('/ref-details.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'ref-details.html'));
});

app.get('/New-update.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'New-update.html'));
});

app.get('/assets.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'assets.html'));
});

app.get('/allocation.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'allocation.html'));
});

app.get('/market-news.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'market-news.html'));
});

app.get('/calendar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'calendar.html'));
});

app.get('/help.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'help.html'));
});

// ADMIN ROUTES
app.get('/api/admin/stats', (req, res) => {
  const stats = {
    totalUsers: users.length,
    totalTrades: trades.length,
    openTrades: trades.filter(t => t.status === 'open').length,
    closedTrades: trades.filter(t => t.status === 'closed').length,
    totalDeposits: deposits.reduce((sum, d) => sum + d.amount, 0),
    totalWithdrawals: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    pendingDeposits: deposits.filter(d => d.status === 'pending').length,
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length
  };
  
  res.json(stats);
});

app.get('/api/admin/users', (req, res) => {
  const userList = users.map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    accountType: user.accountType,
    phone: user.phone,
    country: user.country,
    balance: user.balance,
    level: user.level,
    vipStatus: user.vipStatus,
    joinDate: user.joinDate,
    lastLogin: user.lastLogin,
    trades: user.trades,
    totalProfit: user.totalProfit,
    winRate: user.winRate
  }));
  
  res.json(userList);
});

app.get('/api/admin/trades', (req, res) => {
  const allTrades = trades.map(trade => ({
    ...trade,
    userName: users.find(u => u.id === trade.userId)?.firstName + ' ' + users.find(u => u.id === trade.userId)?.lastName
  }));
  
  res.json(allTrades);
});

app.get('/api/admin/deposits', (req, res) => {
  const allDeposits = deposits.map(deposit => ({
    ...deposit,
    userName: users.find(u => u.id === deposit.userId)?.firstName + ' ' + users.find(u => u.id === deposit.userId)?.lastName
  }));
  
  res.json(allDeposits);
});

app.get('/api/admin/withdrawals', (req, res) => {
  const allWithdrawals = withdrawals.map(withdrawal => ({
    ...withdrawal,
    userName: users.find(u => u.id === withdrawal.userId)?.firstName + ' ' + users.find(u => u.id === withdrawal.userId)?.lastName
  }));
  
  res.json(allWithdrawals);
});

app.get('/api/admin/recent-activity', (req, res) => {
  const activities = [];
  
  // Add recent user registrations
  users.forEach(user => {
    activities.push({
      type: 'registration',
      title: 'New user registered',
      description: `${user.firstName} ${user.lastName} joined`,
      timestamp: user.joinDate,
      userId: user.id
    });
  });
  
  // Add recent trades
  trades.forEach(trade => {
    const user = users.find(u => u.id === trade.userId);
    activities.push({
      type: 'trade',
      title: 'Trade executed',
      description: `${user?.firstName || 'User'} traded ${trade.symbol}`,
      timestamp: trade.openTime,
      userId: trade.userId,
      tradeId: trade.id
    });
  });
  
  // Add recent deposits
  deposits.forEach(deposit => {
    const user = users.find(u => u.id === deposit.userId);
    activities.push({
      type: 'deposit',
      title: 'Deposit request',
      description: `${user?.firstName || 'User'} requested deposit of $${deposit.amount}`,
      timestamp: deposit.date,
      userId: deposit.userId,
      depositId: deposit.id
    });
  });
  
  // Add recent withdrawals
  withdrawals.forEach(withdrawal => {
    const user = users.find(u => u.id === withdrawal.userId);
    activities.push({
      type: 'withdrawal',
      title: 'Withdrawal request',
      description: `${user?.firstName || 'User'} requested withdrawal of $${withdrawal.amount}`,
      timestamp: withdrawal.date,
      userId: withdrawal.userId,
      withdrawalId: withdrawal.id
    });
  });
  
  // Sort by timestamp (most recent first) and limit to 50 items
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json(activities.slice(0, 50));
});

// Initialize data and start server
loadInitialData().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MitheralFX Backend Server running on port ${PORT}`);
    console.log(`Demo user: demo@mitheralfx.com / demo123`);
    console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
    console.log(`Ready for deployment!`);
  });
});
