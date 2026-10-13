import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const router: IRouter = Router();

router.use(healthRouter);

try {
  const backendPath = path.resolve(__dirname, "../../../../backend/src/routes");
  const authRoutes = require(path.join(backendPath, "authRoutes.js"));
  const studentRoutes = require(path.join(backendPath, "studentRoutes.js"));
  const sponsorRoutes = require(path.join(backendPath, "sponsorRoutes.js"));
  const adminRoutes = require(path.join(backendPath, "adminRoutes.js"));
  const messageRoutes = require(path.join(backendPath, "messageRoutes.js"));
  const reviewRoutes = require(path.join(backendPath, "reviewRoutes.js"));

  router.use("/auth", authRoutes);
  router.use("/students", studentRoutes);
  router.use("/sponsors", sponsorRoutes);
  router.use("/admin", adminRoutes);
  router.use("/messages", messageRoutes);
  router.use("/reviews", reviewRoutes);
} catch (e) {
  console.warn("Could not load modular backend routes into api-server:", e);
}

export default router;
