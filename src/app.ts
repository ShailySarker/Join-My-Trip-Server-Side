import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
const app = express();

app.use(cookieParser());
app.use(express.json()); //for json data parse
app.set("trust proxy", 1); //all external live links's proxy will trust
app.use(express.urlencoded({ extended: true })); //for form data

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Join My Trip Server!",
  });
});

export default app;
