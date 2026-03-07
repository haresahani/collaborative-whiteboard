import express, { type Express } from "express";
import authRoutes from "./modules/auth/auth.routes";
import { rateLimiter } from "./middleware/rateLimiter";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes, rateLimiter);

app.get("/", (req, res) => {
  res.send("Express server is active");
});

export default app;
