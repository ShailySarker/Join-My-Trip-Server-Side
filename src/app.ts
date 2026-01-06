import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import passport from "passport";
import cors from "cors";
import { envVars } from "./app/config/env";
import { router } from "./app/routes";
import { PaymentControllers } from "./app/modules/payment/payment.controller";
import bodyParser from "body-parser";

const app = express();

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  PaymentControllers.handleWebhook
);

app.use(cookieParser());
app.use(express.json()); //for json data parse
app.set("trust proxy", 1); //all external live links's proxy will trust
app.use(express.urlencoded({ extended: true })); //for form data

app.use(
  cors({
    origin: envVars.FRONTEND.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/v1/", router);

app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    message: "Welcome to Join My Trip Server!",
  });
});

// global error handler
app.use(globalErrorHandler);

// not found route
app.use(notFound);

export default app;
