const fs = require("fs/promises");
const path = require("path");

const dataFile = path.join(__dirname, "staff.json");

async function readStaff() {
  try {
    const contents = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(contents || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeStaff(staff) {
  const temporaryFile = dataFile + ".tmp";
  await fs.writeFile(temporaryFile, JSON.stringify(staff, null, 2), { encoding: "utf8", mode: 0o600 });
  await fs.rename(temporaryFile, dataFile);
}

async function findStaffByEmail(email) {
  const staff = await readStaff();
  return staff.find(item => item.email.toLowerCase() === email.toLowerCase()) || null;
}

async function findStaffById(id) {
  const staff = await readStaff();
  return staff.find(item => item.id === id) || null;
}

async function ensureInitialAdmin() {
  const email = (process.env.STAFF_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.STAFF_ADMIN_PASSWORD || "";
  const fullName = (process.env.STAFF_ADMIN_NAME || "System Administrator").trim();
  const staffNumber = (process.env.STAFF_ADMIN_NUMBER || "ADMIN-001").trim();

  if (!email && !password) return;
  if (!email || password.length < 12) {
    throw new Error("Set both STAFF_ADMIN_EMAIL and STAFF_ADMIN_PASSWORD (at least 12 characters).");
  }

  const staff = await readStaff();
  if (staff.some(item => item.email.toLowerCase() === email)) return;

  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);
  staff.push({
    id: "STAFF-" + Date.now(),
    fullName,
    staffNumber,
    email,
    department: "Administration",
    role: "system_admin",
    passwordHash,
    active: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString()
  });
  await writeStaff(staff);
  console.log("Initial system administrator account created.");
}

module.exports = { readStaff, writeStaff, findStaffByEmail, findStaffById, ensureInitialAdmin };
