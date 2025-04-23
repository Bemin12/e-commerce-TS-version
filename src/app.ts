import path from 'path';
import * as url from 'url';

import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';
import mongoSanitizer from 'express-mongo-sanitize';
import hpp from 'hpp';

import APIError from './utils/apiError.js';
import globalErrorHandler from './middlewares/errorMiddleware.js';

import * as orderController from './controllers/orderController.js';
import sanitizeXss from './middlewares/xssMiddleware.js';
// Routes
import mountRoutes from './routes/index.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// express app
const app = express();

app.set('trust proxy', process.env.NODE_ENV === 'production');

// Middlewares

// Enable CORS
app.use(cors());
app.options('*', cors());

app.use(helmet());

// Apply rate limit
const limiter = rateLimit({
  max: 100,
  windowMs: 30 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in half an hour',
  validate: { xForwardedForHeader: false },
});
app.use('/api', limiter);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Stripe checkout webhook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  orderController.webhookCheckout,
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'uploads')));

// Data sanitization against NoSQL query injection
app.use(mongoSanitizer());

// Sanitize user input to prevent XSS
app.use(sanitizeXss());

// Prevent http parameter pollution
app.use(hpp({ whitelist: ['ratingsAverage', 'ratingsQuantity', 'price', 'color'] }));

// Compress the response
app.use(compression());

// Mount Routes
mountRoutes(app);

app.all('*', (req, res, next) => {
  next(new APIError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler middleware for express
app.use(globalErrorHandler);

export default app;
