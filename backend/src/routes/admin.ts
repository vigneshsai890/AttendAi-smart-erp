import { Router } from 'express';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Section } from '../models/Section';
import { Course } from '../models/Course';
import { CourseAssignment } from '../models/CourseAssignment';
import { Enrollment } from '../models/Enrollment';
import { Faculty } from '../models/Faculty';
import { Student } from '../models/Student';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// DEPARTMENTS
// ---------------------------------------------------------------------------

adminRouter.get('/departments', async (_req, res) => {
  try {
    const departments = await Department.find().sort({ code: 1 }).lean();

    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const [sections, studentCount, facultyCount, courseCount] =
          await Promise.all([
            Section.find({ departmentId: dept._id })
              .sort({ name: 1 })
              .lean(),
            Student.countDocuments({ departmentId: dept._id }),
            Faculty.countDocuments({ departmentId: dept._id }),
            Course.countDocuments({ departmentId: dept._id }),
          ]);

        return {
          ...dept,
          sections,
          studentCount,
          facultyCount,
          courseCount,
        };
      }),
    );

    res.json({ departments: enriched });
  } catch (err) {
    console.error('GET /departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

adminRouter.post('/departments', async (req, res) => {
  try {
    const { code, name, description, sections } = req.body;

    if (!code || !name) {
      return res
        .status(400)
        .json({ error: 'code and name are required' });
    }

    const existing = await Department.findOne({ code });
    if (existing) {
      return res
        .status(409)
        .json({ error: `Department with code "${code}" already exists` });
    }

    const department = await Department.create({ code, name, description });

    if (Array.isArray(sections) && sections.length > 0) {
      const sectionDocs = sections.map(
        (s: { name: string; year?: number; batchYear?: number }) => ({
          name: s.name,
          year: s.year,
          batchYear: s.batchYear,
          departmentId: department._id,
        }),
      );
      await Section.insertMany(sectionDocs);
    }

    const created = await Department.findById(department._id).lean();
    const createdSections = await Section.find({
      departmentId: department._id,
    })
      .sort({ name: 1 })
      .lean();

    res.status(201).json({
      department: { ...created, sections: createdSections },
    });
  } catch (err) {
    console.error('POST /departments error:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// ---------------------------------------------------------------------------
// COURSES
// ---------------------------------------------------------------------------

adminRouter.get('/courses', async (_req, res) => {
  try {
    const courses = await Course.find()
      .sort({ code: 1 })
      .populate('departmentId', 'code name')
      .lean();

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const [assignments, enrollmentCount] = await Promise.all([
          CourseAssignment.find({ courseId: course._id })
            .populate({
              path: 'facultyId',
              populate: { path: 'userId', select: 'name' },
            })
            .lean(),
          Enrollment.countDocuments({ courseId: course._id }),
        ]);

        return {
          ...course,
          courseAssignments: assignments,
          enrollmentCount,
        };
      }),
    );

    res.json({ courses: enriched });
  } catch (err) {
    console.error('GET /courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

adminRouter.post('/courses', async (req, res) => {
  try {
    const {
      code,
      name,
      credits,
      courseType,
      departmentId,
      semester,
      facultyId,
      studentIds,
    } = req.body;

    if (!code || !name || !departmentId || !semester) {
      return res.status(400).json({
        error: 'code, name, departmentId, and semester are required',
      });
    }

    const existing = await Course.findOne({ code });
    if (existing) {
      return res
        .status(409)
        .json({ error: `Course with code "${code}" already exists` });
    }

    // Look up department name so we can fill the legacy `department` string field
    const dept = await Department.findById(departmentId).lean();
    const deptName = dept ? dept.name : '';

    const course = await Course.create({
      code,
      name,
      credits,
      courseType,
      department: deptName,
      departmentId,
      semester,
    });

    if (facultyId) {
      await CourseAssignment.create({
        courseId: course._id,
        facultyId,
        academicYear: new Date().getFullYear(),
        semester,
      });
    }

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const enrollments = studentIds.map((sid: string) => ({
        studentId: sid,
        courseId: course._id,
        academicYear: new Date().getFullYear(),
        semester,
      }));
      await Enrollment.insertMany(enrollments);
    }

    const created = await Course.findById(course._id)
      .populate('departmentId', 'code name')
      .lean();

    res.status(201).json({ course: created });
  } catch (err) {
    console.error('POST /courses error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// ---------------------------------------------------------------------------
// FACULTY
// ---------------------------------------------------------------------------

adminRouter.get('/faculty', async (_req, res) => {
  try {
    const faculty = await Faculty.find()
      .sort({ employeeId: 1 })
      .populate('userId', 'id name email isActive')
      .populate('departmentId', 'code name')
      .lean();

    res.json({ faculty });
  } catch (err) {
    console.error('GET /faculty error:', err);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

adminRouter.post('/faculty', async (req, res) => {
  try {
    const { name, email, password, employeeId, designation, departmentId } =
      req.body;

    if (!name || !email || !password || !employeeId || !departmentId) {
      return res.status(400).json({
        error:
          'name, email, password, employeeId, and departmentId are required',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: `User with email "${email}" already exists` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      role: 'FACULTY',
      passwordHash,
    });

    const faculty = await Faculty.create({
      userId: user._id,
      employeeId,
      designation: designation || 'Assistant Professor',
      departmentId,
    });

    const populated = await Faculty.findById(faculty._id)
      .populate('userId', 'id name email isActive')
      .populate('departmentId', 'code name')
      .lean();

    res.status(201).json({
      faculty: populated,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('POST /faculty error:', err);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

// ---------------------------------------------------------------------------
// STUDENTS
// ---------------------------------------------------------------------------

adminRouter.get('/students', async (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(
      1,
      parseInt(req.query.limit as string, 10) || 50,
    );
    const skip = (page - 1) * limit;

    // Build a filter. If there is a search term we need to match against
    // user name / email (which live in User) or rollNumber (on Student).
    // Strategy: find matching user IDs first, then query students.
    let filter: Record<string, unknown> = {};

    if (search) {
      const regex = new RegExp(search, 'i');

      // Users whose name or email match
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
        role: 'STUDENT',
      })
        .select('_id')
        .lean();

      const matchingUserIds = matchingUsers.map((u) => u._id);

      filter = {
        $or: [
          { userId: { $in: matchingUserIds } },
          { rollNumber: regex },
        ],
      };
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ rollNumber: 1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'id name email isActive')
        .populate('departmentId', 'code name')
        .populate('sectionId', 'name')
        .lean(),
      Student.countDocuments(filter),
    ]);

    res.json({ students, total, page, limit });
  } catch (err) {
    console.error('GET /students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

adminRouter.post('/students', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNumber,
      regNumber,
      year,
      semester,
      sectionId,
      departmentId,
      batchYear,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !rollNumber ||
      !regNumber ||
      !sectionId ||
      !departmentId
    ) {
      return res.status(400).json({
        error:
          'name, email, password, rollNumber, regNumber, sectionId, and departmentId are required',
      });
    }

    const [existingUser, existingRoll] = await Promise.all([
      User.findOne({ email }),
      Student.findOne({ rollNumber }),
    ]);

    if (existingUser) {
      return res
        .status(409)
        .json({ error: `User with email "${email}" already exists` });
    }
    if (existingRoll) {
      return res.status(409).json({
        error: `Student with rollNumber "${rollNumber}" already exists`,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      role: 'STUDENT',
      passwordHash,
    });

    const student = await Student.create({
      userId: user._id,
      rollNumber,
      regNumber,
      year,
      semester,
      sectionId,
      departmentId,
      batchYear,
    });

    const populated = await Student.findById(student._id)
      .populate('userId', 'id name email isActive')
      .populate('departmentId', 'code name')
      .populate('sectionId', 'name')
      .lean();

    res.status(201).json({
      student: populated,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('POST /students error:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

adminRouter.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, year, semester, sectionId, departmentId } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update associated User fields
    const userUpdate: Record<string, unknown> = {};
    if (name !== undefined) userUpdate.name = name;
    if (email !== undefined) userUpdate.email = email;
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(student.userId, userUpdate);
    }

    // Update Student fields
    const studentUpdate: Record<string, unknown> = {};
    if (year !== undefined) studentUpdate.year = year;
    if (semester !== undefined) studentUpdate.semester = semester;
    if (sectionId !== undefined) studentUpdate.sectionId = sectionId;
    if (departmentId !== undefined) studentUpdate.departmentId = departmentId;
    if (Object.keys(studentUpdate).length > 0) {
      await Student.findByIdAndUpdate(id, studentUpdate);
    }

    const updated = await Student.findById(id)
      .populate('userId', 'id name email isActive')
      .populate('departmentId', 'code name')
      .populate('sectionId', 'name')
      .lean();

    res.json({ student: updated });
  } catch (err) {
    console.error('PUT /students/:id error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

adminRouter.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await Promise.all([
      Student.findByIdAndDelete(id),
      User.findByIdAndDelete(student.userId),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /students/:id error:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});
