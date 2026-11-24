const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const allowedOrigins = env.clientOrigin.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: env.clientOrigin === '*' ? true : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Expense Tracker API is running.', time: new Date().toISOString() });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB(env.mongoUri);
  const server = app.listen(env.port, () => {
    console.log(`Expense Tracker API listening on http://localhost:${env.port}`);
  });
  return server;
};

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
