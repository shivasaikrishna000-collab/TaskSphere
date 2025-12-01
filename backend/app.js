const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const profileRoutes = require("./routes/profileRoutes");

app.use(express.json());
app.use(cors());

const mongoUrl = process.env.MONGODB_URL;
// Connect to MongoDB (log errors instead of throwing to keep process from crashing silently)
mongoose.connect(mongoUrl)
  .then(() => console.log("Mongodb connected..."))
  .catch(err => {
    console.error('Mongodb connection error', err);
  });

// Global error handlers to log unexpected exceptions/rejections and keep diagnostics visible
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
});

// start Agenda after DB connection
const { agenda, startAgenda, listJobs, sendTestEmail } = require("./utils/agenda");
mongoose.connection.once('open', async () => {
  try {
    await startAgenda();
    console.log('Agenda started');
  } catch (err) {
    console.error('Failed to start Agenda', err);
  }
});

// debug endpoint to list scheduled agenda jobs
app.get('/api/debug/agenda-jobs', async (req, res) => {
  try {
    const jobs = await listJobs();
    // If listJobs returned raw Mongo docs, return them directly for inspection
    const out = jobs.map(j => {
      if (j && j.attrs) return { name: j.attrs.name, nextRunAt: j.attrs.nextRunAt, data: j.attrs.data, raw: null };
      return j;
    });
    res.json({ jobs: out });
  } catch (err) {
    console.error('Failed to list agenda jobs', err);
    res.status(500).json({ error: 'Failed to list jobs', message: err && err.message });
  }
});

// Debug endpoint: send a test email using the configured transporter
// Test-email endpoint: accept POST or GET for convenience
app.post('/api/debug/send-test-email', async (req, res) => {
  try {
    const to = req.body && req.body.to;
    const info = await sendTestEmail(to);
    res.json({ ok: true, info });
  } catch (err) {
    console.error('Failed to send test email', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});
app.get('/api/debug/send-test-email', async (req, res) => {
  try {
    const to = req.query && req.query.to;
    const info = await sendTestEmail(to);
    res.json({ ok: true, info });
  } catch (err) {
    console.error('Failed to send test email', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});

// Debug: fetch a task by id to inspect reminder fields and populated user email
app.get('/api/debug/task/:id', async (req, res) => {
  try {
    const Task = require('./models/Task');
    const task = await Task.findById(req.params.id).populate('user');
    if (!task) return res.status(404).json({ ok: false, message: 'Task not found' });
    res.json({ ok: true, task });
  } catch (err) {
    console.error('Debug task fetch error', err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});

// Debug: reschedule a job for a given taskId. Body: { taskId: string, when?: ISOString }
// Reschedule a job: accept POST or GET (GET useful in browser)
app.post('/api/debug/reschedule-job', async (req, res) => {
  try {
    const { taskId, when } = req.body || {};
    if (!taskId) return res.status(400).json({ ok: false, message: 'taskId required' });
    // cancel existing jobs for this task
    await agenda.cancel({ 'data.taskId': taskId });
    const whenDate = when ? new Date(when) : new Date(Date.now() + 60 * 1000); // default 1 minute from now
    await agenda.schedule(whenDate, 'send task reminder', { taskId });
    console.log(`Agenda: rescheduled reminder for task ${taskId} at ${whenDate.toISOString()}`);
    res.json({ ok: true, taskId, nextRunAt: whenDate.toISOString() });
  } catch (err) {
    console.error('Failed to reschedule job', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});
app.get('/api/debug/reschedule-job', async (req, res) => {
  try {
    const taskId = req.query && req.query.taskId;
    const when = req.query && req.query.when;
    if (!taskId) return res.status(400).json({ ok: false, message: 'taskId required' });
    await agenda.cancel({ 'data.taskId': taskId });
    const whenDate = when ? new Date(when) : new Date(Date.now() + 60 * 1000);
    await agenda.schedule(whenDate, 'send task reminder', { taskId });
    console.log(`Agenda: rescheduled reminder for task ${taskId} at ${whenDate.toISOString()}`);
    res.json({ ok: true, taskId, nextRunAt: whenDate.toISOString() });
  } catch (err) {
    console.error('Failed to reschedule job', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});

// Reschedule all failed jobs: POST (or GET for convenience)
app.post('/api/debug/reschedule-failed', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const col = db.collection('agendaJobs');
    const failed = await col.find({ failCount: { $gt: 0 } }).toArray();
    const rescheduled = [];
    for (const f of failed) {
      try {
        const taskId = f && f.data && f.data.taskId;
        if (!taskId) continue;
        // cancel any existing jobs for that task and schedule in 1 minute
        await agenda.cancel({ 'data.taskId': taskId });
        const whenDate = new Date(Date.now() + 60 * 1000);
        await agenda.schedule(whenDate, 'send task reminder', { taskId });
        rescheduled.push({ taskId, nextRunAt: whenDate.toISOString() });
      } catch (inner) {
        console.error('Failed to reschedule failed job', f, inner && inner.stack ? inner.stack : inner);
      }
    }
    res.json({ ok: true, rescheduled, count: rescheduled.length });
  } catch (err) {
    console.error('Failed to reschedule failed jobs', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});
app.get('/api/debug/reschedule-failed', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const col = db.collection('agendaJobs');
    const failed = await col.find({ failCount: { $gt: 0 } }).toArray();
    res.json({ ok: true, failedCount: failed.length, failed });
  } catch (err) {
    console.error('Failed to list failed jobs', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err && err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "../frontend/build")));
  app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "../frontend/build/index.html")));
}

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Backend is running on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err && err.stack ? err.stack : err);
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop other instances or change PORT.`);
  }
});
