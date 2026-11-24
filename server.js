const express = require("express");
const cors = require("cors");
const requestRoutes = require("./routes/requests");
const staffRoutes = require("./routes/staff");
const { ensureInitialAdmin } = require("./database/staff-store");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "SPU Academic Workflow Backend is running",
    status: "ok",
    staffAuthentication: "available"
  });
});

app.use("/api/staff", staffRoutes);
app.use("/api/requests", requestRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

async function start() {
  try {
    await ensureInitialAdmin();
    app.listen(PORT, () => {
      console.log(`SPU Academic Workflow Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

start();
