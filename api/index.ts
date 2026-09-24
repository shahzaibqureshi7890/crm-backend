import app from "../src/server.js";
import pool from "../src/config/database.js";
pool.query("SELECT 1").catch((err) => {
  console.error("Vercel Serverless DB pre-check failed:", err);
});
export default app;
