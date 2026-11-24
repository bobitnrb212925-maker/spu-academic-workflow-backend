const express = require("express");
const { readRequests, writeRequests } = require("../database/store");
const { requireStaff, allowRoles } = require("../middleware/auth");
const router = express.Router();

const validStatuses = [
  "Submitted",
  "HOD Review",
  "Dean Review",
  "Registrar Review",
  "Approved",
  "Rejected"
];

router.post("/", async (req, res, next) => {
  try {
    const { studentName, admissionNumber, requestType, description, department, programme, title, course, priority } = req.body;

    if (![studentName, admissionNumber, requestType, description].every(
      value => typeof value === "string" && value.trim()
    )) {
      return res.status(400).json({
        message: "Student name, admission number, request type and description are required."
      });
    }

    const requests = await readRequests();
    const now = new Date().toISOString();
    const request = {
      id: `SPU-${Date.now()}`,
      studentName: studentName.trim(),
      admissionNumber: admissionNumber.trim(),
      requestType: requestType.trim(),
      title: typeof title === "string" ? title.trim() : "",
      course: typeof course === "string" ? course.trim() : "",
      priority: typeof priority === "string" ? priority.trim() : "Medium",
      description: description.trim(),
      department: typeof department === "string" ? department.trim() : "",
      programme: typeof programme === "string" ? programme.trim() : "",
      status: "Submitted",
      submittedAt: now,
      updatedAt: now,
      history: [{ status: "Submitted", note: "Request submitted", date: now }]
    };

    requests.push(request);
    await writeRequests(requests);
    res.status(201).json({ message: "Request submitted successfully.", request });
  } catch (error) {
    next(error);
  }
});

// Staff-only request queue.
router.get("/", requireStaff, allowRoles(
  "lecturer", "hod", "dean", "academic_registrar", "quality_assurance", "system_admin"
), async (req, res, next) => {
  try {
    res.json(await readRequests());
  } catch (error) {
    next(error);
  }
});

// Temporary student lookup for the existing prototype.
// Do not use real student data until student authentication and ownership checks are added.
router.get("/student/:admissionNumber", async (req, res, next) => {
  try {
    const requests = await readRequests();
    const studentRequests = requests.filter(
      item => item.admissionNumber.toLowerCase() === req.params.admissionNumber.toLowerCase()
    );
    res.json(studentRequests);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireStaff, async (req, res, next) => {
  try {
    const requests = await readRequests();
    const request = requests.find(item => item.id === req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });
    res.json(request);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireStaff, allowRoles(
  "lecturer", "hod", "dean", "academic_registrar", "system_admin"
), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid request status." });
    }

    const requests = await readRequests();
    const index = requests.findIndex(item => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Request not found." });

    const now = new Date().toISOString();
    requests[index].status = status;
    requests[index].updatedAt = now;
    requests[index].history.push({
      status,
      note: typeof note === "string" ? note.trim() : "",
      date: now,
      actionBy: req.staff.id,
      actionByName: req.staff.fullName,
      actionByRole: req.staff.role
    });

    await writeRequests(requests);
    res.json({ message: "Request status updated.", request: requests[index] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
