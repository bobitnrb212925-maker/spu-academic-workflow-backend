const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readStaff, writeStaff, findStaffByEmail } = require("../database/staff-store");
const { requireStaff, allowRoles } = require("../middleware/auth");

const router = express.Router();

const roles = [
  "lecturer",
  "hod",
  "dean",
  "academic_registrar",
  "quality_assurance",
  "system_admin"
];

function publicStaff(staff) {
  const { passwordHash, ...safe } = staff;
  return safe;
}

router.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) {
      return res.status(400).json({ message: "Enter your staff email and password." });
    }

    const staff = await findStaffByEmail(email);
    if (!staff || !staff.active || !(await bcrypt.compare(password, staff.passwordHash))) {
      return res.status(401).json({ message: "Incorrect staff email or password." });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ message: "Staff sign-in is not configured. Contact the system administrator." });
    }

    const token = jwt.sign(
      { staffId: staff.id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h", issuer: "spu-academic-workflow" }
    );

    res.json({
      message: "Staff sign-in successful.",
      token,
      expiresIn: "8h",
      staff: publicStaff(staff)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireStaff, async (req, res) => {
  res.json({ staff: req.staff });
});

router.get("/", requireStaff, allowRoles("system_admin"), async (req, res, next) => {
  try {
    const staff = await readStaff();
    res.json(staff.map(publicStaff));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireStaff, allowRoles("system_admin"), async (req, res, next) => {
  try {
    const { fullName, staffNumber, email, department, role, temporaryPassword } = req.body;
    if (![fullName, staffNumber, email, department, role, temporaryPassword].every(
      value => typeof value === "string" && value.trim()
    )) {
      return res.status(400).json({ message: "Complete all staff account fields." });
    }
    if (!roles.includes(role) || role === "system_admin") {
      return res.status(400).json({ message: "Choose a valid non-administrator staff role. Administrator accounts must be provisioned securely." });
    }
    if (temporaryPassword.length < 12) {
      return res.status(400).json({ message: "Temporary passwords must contain at least 12 characters." });
    }

    const staff = await readStaff();
    const normalizedEmail = email.trim().toLowerCase();
    if (staff.some(item => item.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ message: "A staff account with that email already exists." });
    }
    if (staff.some(item => item.staffNumber.toLowerCase() === staffNumber.trim().toLowerCase())) {
      return res.status(409).json({ message: "That staff number is already registered." });
    }

    const bcryptHash = await bcrypt.hash(temporaryPassword, 12);
    const created = {
      id: "STAFF-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      fullName: fullName.trim(),
      staffNumber: staffNumber.trim(),
      email: normalizedEmail,
      department: department.trim(),
      role,
      passwordHash: bcryptHash,
      active: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      createdBy: req.staff.id
    };
    staff.push(created);
    await writeStaff(staff);
    res.status(201).json({ message: "Staff account created. Give the temporary password to the staff member securely.", staff: publicStaff(created) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/active", requireStaff, allowRoles("system_admin"), async (req, res, next) => {
  try {
    if (typeof req.body.active !== "boolean") {
      return res.status(400).json({ message: "The active field must be true or false." });
    }
    const staff = await readStaff();
    const index = staff.findIndex(item => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Staff account not found." });
    if (staff[index].role === "system_admin" && staff[index].id === req.staff.id && !req.body.active) {
      return res.status(400).json({ message: "You cannot deactivate your own administrator account." });
    }
    staff[index].active = req.body.active;
    staff[index].updatedAt = new Date().toISOString();
    await writeStaff(staff);
    res.json({ message: "Staff account updated.", staff: publicStaff(staff[index]) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
