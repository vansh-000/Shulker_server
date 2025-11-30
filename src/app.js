import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();

import './utils/passport.js';

const app = express();
const PORT = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
import userRouter from './routes/user.routes.js';
app.use("/api/v1/users", userRouter);
import meetingsRouter from './routes/meetings.routes.js';
app.use("/api/v1/meetings", meetingsRouter);
import summaryRouter from './routes/summary.routes.js';
app.use("/api/v1/summary", summaryRouter);
import questionsRouter from './routes/questions.routes.js';
app.use("/api/v1/question", questionsRouter);
import responsesRouter from './routes/responses.routes.js';
app.use("/api/v1/response", responsesRouter);
import filesRouter from './routes/files.routes.js';
app.use("/api/v1", filesRouter);

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.statusCode || 500,
  });
});

export default app;
