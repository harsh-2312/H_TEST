import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimiter } from "./middleware/rateLimiter";
import { authRouter } from "./routes/auth";
import { transactionRouter } from "./routes/transactions";
import { businessRouter } from "./routes/businesses";
import { paymentMethodRouter } from "./routes/paymentMethods";
import { categoryRouter } from "./routes/categories";
import { userRouter } from "./routes/users";
import { validateAuthToken } from "./middleware/auth";

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(morgan("combined"));
app.use(rateLimiter);

app.use("/api/auth", authRouter);
app.use("/api/businesses", validateAuthToken, businessRouter);
app.use("/api/transactions", validateAuthToken, transactionRouter);
app.use("/api/payment-methods", validateAuthToken, paymentMethodRouter);
app.use("/api/categories", validateAuthToken, categoryRouter);
app.use("/api/users", validateAuthToken, userRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});
