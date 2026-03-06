import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), "../../env/dev.env"),
});

const app = express();

app.use(express.json()); //json to js req.body
app.use(express.urlencoded({ extended: true })); //url

const PORT = process.env.PORT || 1111;

// await mongoose.connect(process.env.MONGO_URL!).then(() => {
//   // console.log(process.env.MONGO_URL);
//   console.log("MongoDB Connected!");
//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
// });

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL!);
    console.log("MongoDB Connected!");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer().catch((err) => {
  console.error("Startup failed:", err);
});
