const express = require("express");
const cors = require("cors");
const requestRoutes = require("./routes/requests");

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for the student application domain before production deployment.
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "SPU Academic Workflow Backend is running",
    status: "ok"
  });
});

app.use("/api/requests", requestRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`SPU Academic Workflow Backend running on port ${PORT}`);
});
