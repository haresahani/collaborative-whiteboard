import express from "express";
const app = express();

const PORT = process.env.dev || 4000;

app.get("/", (req, res) => {
  res.send("Hellow from the API!");
});

app.listen(PORT, () => {
  console.log(`API is running at http://localhost:${PORT}`);
});
