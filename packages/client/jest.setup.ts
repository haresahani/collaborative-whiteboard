// jest.setup.ts
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
console.log("Jest setup loaded, VITE_API_URL:", process.env.VITE_API_URL); // Debug
