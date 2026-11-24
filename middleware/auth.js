const jwt = require("jsonwebtoken");
const { findStaffById } = require("../database/staff-store");

async function requireStaff(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Staff sign-in is required." });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(503).json({ message: "Staff authentication is not configured." });

    const payload = jwt.verify(token, secret);
    const staff = await findStaffById(payload.staffId);
    if (!staff || !staff.active) {
      return res.status(401).json({ message: "This staff account is inactive or no longer exists." });
    }

    req.staff = {
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      staffNumber: staff.staffNumber,
      department: staff.department,
      role: staff.role
    };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your staff session is invalid or expired. Sign in again." });
    }
    next(error);
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.staff || !roles.includes(req.staff.role)) {
      return res.status(403).json({ message: "Your staff role is not permitted to perform this action." });
    }
    next();
  };
}

module.exports = { requireStaff, allowRoles };
