
import { User, Course, Progress, Notification } from './models';

export const CourseController = {
  async getAll(req: any, res: any) {
    try {
      const courses = await Course.find({ published: true }).sort({ createdAt: -1 });
      res.status(200).json(courses);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  },

  async getById(req: any, res: any) {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      res.status(200).json(course);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
  
  async create(req: any, res: any) {
    try {
      const courseData = req.body;
      let course;
      if (courseData._id && courseData._id.startsWith('c_')) {
        // If it's a simulation ID or manually provided, try to find and update or create
        course = await Course.findOneAndUpdate({ _id: courseData._id }, courseData, { upsert: true, new: true });
      } else {
        course = new Course(courseData);
        await course.save();
      }
      res.status(201).json(course);
    } catch (e) {
      res.status(400).json({ error: "Validation failed" });
    }
  },

  async delete(req: any, res: any) {
      try {
          await Course.findByIdAndDelete(req.params.id);
          res.status(204).send();
      } catch (e) {
          res.status(500).json({ error: "Deletion failed" });
      }
  },

  async getEnrolledStudents(req: any, res: any) {
    try {
      const { id: courseId } = req.params;
      const progressDocs = await Progress.find({ courseId }).populate('userId');
      const results = progressDocs.map(p => ({
        user: p.userId,
        progress: p
      }));
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch student data" });
    }
  },

  async scheduleLive(req: any, res: any) {
    try {
      const { courseId } = req.params;
      const session = req.body;
      const course = await Course.findByIdAndUpdate(courseId, { liveSession: session }, { new: true });
      res.json(course);
    } catch (e) {
      res.status(500).json({ error: "Failed to schedule live session" });
    }
  }
};

export const UserController = {
    async getAll(req: any, res: any) {
        try {
            const users = await User.find({}).select('-password');
            res.json(users);
        } catch (e) {
            res.status(500).json({ error: "Failed to fetch users" });
        }
    },

    async create(req: any, res: any) {
        try {
            const user = new User(req.body);
            await user.save();
            res.status(201).json(user);
        } catch (e) {
            res.status(400).json({ error: "Failed to create user" });
        }
    },

    async enroll(req: any, res: any) {
        const { userId } = req.params;
        const { courseId } = req.body;
        
        try {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: "User not found" });
            
            if (!user.enrolledCourseIds.includes(courseId)) {
                user.enrolledCourseIds.push(courseId);
                await user.save();
                
                const progress = new Progress({
                    userId,
                    courseId,
                    completedModuleIds: [],
                    quizResults: [],
                    capstoneStatus: 'pending'
                });
                await progress.save();
            }
            res.json(user);
        } catch (e) {
            res.status(500).json({ error: "Enrollment failed" });
        }
    },

    async toggleSuspension(req: any, res: any) {
        try {
            const { userId } = req.params;
            const { isSuspended } = req.body;
            
            if (!userId) return res.status(400).json({ error: "User ID required" });

            const user = await User.findByIdAndUpdate(userId, { isSuspended }, { new: true }).select('-password');
            if (!user) return res.status(404).json({ error: "User not found in database" });
            
            res.json(user);
        } catch (e) {
            console.error("Suspension Error:", e);
            res.status(500).json({ error: "Suspension update failed. Ensure ID is valid." });
        }
    },

    async delete(req: any, res: any) {
        try {
            const { userId } = req.params;
            if (!userId) return res.status(400).json({ error: "User ID required" });

            const user = await User.findByIdAndDelete(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            await Progress.deleteMany({ userId });
            await Notification.deleteMany({ userId });
            res.status(204).send();
        } catch (e) {
            console.error("Deletion Error:", e);
            res.status(500).json({ error: "User deletion failed" });
        }
    },

    async login(req: any, res: any) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user || user.password !== password) {
                return res.status(401).json({ error: "Invalid email or password" });
            }
            res.json(user);
        } catch (e) {
            res.status(500).json({ error: "Login failed" });
        }
    }
};

export const ProgressController = {
    async get(req: any, res: any) {
        try {
          const { userId, courseId } = req.params;
          let progress = await Progress.findOne({ userId, courseId });
          if (!progress) {
            progress = new Progress({ userId, courseId });
            await progress.save();
          }
          res.json(progress);
        } catch (e) {
          res.status(500).json({ error: "Progress fetch error" });
        }
    },

    async update(req: any, res: any) {
        try {
          const progress = await Progress.findByIdAndUpdate(req.body._id, req.body, { new: true });
          if (!progress) return res.status(404).json({ error: "Progress not found" });
          res.json(progress);
        } catch (e) {
          res.status(400).json({ error: "Update failed" });
        }
    },

    async gradeCapstone(req: any, res: any) {
      try {
        const { id: progressId } = req.params;
        const { score, feedback } = req.body;
        const progress = await Progress.findByIdAndUpdate(progressId, {
          capstoneGrade: score,
          capstoneFeedback: feedback,
          capstoneStatus: 'graded'
        }, { new: true });
        if (!progress) return res.status(404).json({ error: "Progress not found" });
        res.json(progress);
      } catch (e) {
        res.status(500).json({ error: "Grading failed" });
      }
    }
};

export const NotificationController = {
    async getByUser(req: any, res: any) {
        try {
            const { userId } = req.params;
            // Prevent 500 error by checking if userId is a valid MongoDB ObjectId
            if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.json([]);
            }
            const notifications = await Notification.find({ userId }).sort({ date: -1 });
            res.json(notifications);
        } catch (e) {
            res.status(500).json({ error: "Failed to fetch notifications" });
        }
    },

    async send(req: any, res: any) {
        try {
            const notif = new Notification(req.body);
            await notif.save();
            res.status(201).json(notif);
        } catch (e) {
            res.status(400).json({ error: "Failed to send notification" });
        }
    },

    async markRead(req: any, res: any) {
        try {
            const { id } = req.params;
            await Notification.findByIdAndUpdate(id, { read: true });
            res.status(200).send();
        } catch (e) {
            res.status(500).json({ error: "Failed to update notification" });
        }
    }
};
