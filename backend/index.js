import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { validateMeshyConfig } from './src/config/meshy.config.js';
import { resumePendingPolls } from './src/services/pollingService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_kds', (restaurantId) => {
    if (restaurantId) {
      socket.join(`KDS_ROOM_${restaurantId}`);
    }
  });

  socket.on('join_order', (data) => {
    const { restaurantId, orderCode } = typeof data === 'string' ? { orderCode: data } : data;

    if (orderCode) {
      const room = restaurantId ? `ORDER_ROOM_${restaurantId}_${orderCode}` : orderCode;

      socket.join(room);
    }
  });

  socket.on('join_room', (room) => {
    if (room) socket.join(room);
  });

  socket.on('leave_room', (room) => {
    if (room) socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('[BODY]', JSON.stringify(req.body, null, 2));
  }
  next();
});

connectDB()
  .then(async () => {
    console.log('Database connected successfully');
    validateMeshyConfig();
    await resumePendingPolls();
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

import dishRoute from './src/routes/dish.route.js';
import orderRoute from './src/routes/order.route.js';
import kdsOrderRoute from './src/routes/kdsorder.route.js';
import userAuthRoutes from './src/routes/userAuth.routes.js';
import platformRouter from './src/routes/platform.route.js';
import planRouter from './src/routes/plan.route.js';
import adminRouter from './src/routes/admin.route.js';
import configRoute from './src/routes/config.route.js';
import inventoryRoute from './src/routes/inventory.route.js';
import expensesRoute from './src/routes/expenses.route.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import settingsRouter from './src/routes/settings.route.js';
import featureAccessRoute from './src/routes/featureAccess.route.js';
import reportsRouter from './src/routes/reports.route.js';

app.use('/api/v1/dishes', dishRoute);
app.use('/api/v1/orders', orderRoute);
app.use('/api/v1/kds', kdsOrderRoute);
app.use('/api/v1/users/auth', userAuthRoutes);
app.use('/api/v1/platform', platformRouter);
app.use('/api/v1/platform/plans', planRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/config', configRoute);
app.use('/api/v1/inventory', inventoryRoute);
app.use('/api/v1/expenses/:restaurantSlug', expensesRoute);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/features', featureAccessRoute);
app.use('/api/v1/reports', reportsRouter);
import chatRoute from './src/routes/chat.route.js';
app.use('/api/v1/chat', chatRoute);

app.get('/', (req, res) => {
  res.send('Hello World!');
});



app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});


import { errorHandler } from './src/middlewares/errorHandler.middleware.js';
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io, app };
