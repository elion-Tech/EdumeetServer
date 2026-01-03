
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: String,
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  enrolledCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  isSuspended: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  thumbnailUrl: String,
  price: { type: Number, default: 0 },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tutorName: String,
  modules: [{
    title: String,
    order: Number,
    videoUrl: String,
    lessonContent: String,
    transcript: String
  }],
  quizzes: [{
    title: String,
    questions: [{
      text: String,
      options: [String],
      correctIndex: Number
    }]
  }],
  capstone: {
    instructions: String,
    type: { type: String, enum: ['project', 'final_exam'] }
  },
  liveSession: {
    topic: String,
    date: Date,
    meetingLink: String,
    isActive: { type: Boolean, default: false }
  },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  completedModuleIds: [String],
  // Fix: Renamed from quizScores to quizResults to align with Progress interface and logic.
  quizResults: [{ quizId: String, score: Number, passed: Boolean, attemptedAt: Date }],
  quizAttempts: [{ quizId: String, count: Number }],
  capstoneStatus: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' },
  capstoneSubmissionText: String,
  capstoneGrade: Number,
  capstoneFeedback: String
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromName: String,
  message: String,
  type: { type: String, enum: ['info', 'grade', 'announcement', 'live'] },
  read: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
export const Progress = mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
