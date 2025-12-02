import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";

const app = express();

app.use(cookieParser());
app.use(express.json()); //for json data parse
app.set("trust proxy", 1); //all external live links's proxy will trust
app.use(express.urlencoded({ extended: true })); //for form data

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
