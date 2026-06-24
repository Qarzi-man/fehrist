require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const authRouter       = require('./routes/auth');
const businessesRouter = require('./routes/businesses');
const dashboardRouter  = require('./routes/dashboard');
const clientsRouter    = require('./routes/clients');
const debtsRouter      = require('./routes/debts');
const analyticsRouter  = require('./routes/analytics');
const membersRouter    = require('./routes/members');
const smsRouter        = require('./routes/sms');
const profileRouter        = require('./routes/profile');
const notificationsRouter  = require('./routes/notifications');
const billingRouter        = require('./routes/billing');
const adminRouter          = require('./routes/admin');

// v1 — primary
app.use('/api/v1/auth',             authRouter);
app.use('/api/v1/businesses',       businessesRouter);
app.use('/api/v1/dashboard',        dashboardRouter);
app.use('/api/v1/clients',          clientsRouter);
app.use('/api/v1/debts',            debtsRouter);
app.use('/api/v1/analytics',        analyticsRouter);
app.use('/api/v1/business/members', membersRouter);
app.use('/api/v1/sms',              smsRouter);
app.use('/api/v1/profile',          profileRouter);
app.use('/api/v1/notifications',    notificationsRouter);
app.use('/api/v1/billing',          billingRouter);
app.use('/api/v1/admin',            adminRouter);

// legacy aliases (kept for backward compatibility)
app.use('/api/auth',             authRouter);
app.use('/api/businesses',       businessesRouter);
app.use('/api/dashboard',        dashboardRouter);
app.use('/api/clients',          clientsRouter);
app.use('/api/debts',            debtsRouter);
app.use('/api/analytics',        analyticsRouter);
app.use('/api/business/members', membersRouter);
app.use('/api/sms',              smsRouter);
app.use('/api/profile',          profileRouter);
app.use('/api/notifications',    notificationsRouter);
app.use('/api/billing',          billingRouter);
app.use('/api/admin',            adminRouter);

app.use(errorHandler);

module.exports = app;
