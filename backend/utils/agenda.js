const Agenda = require("agenda");
const nodemailer = require("nodemailer");
const Task = require("../models/Task");
const mongoose = require('mongoose');

require("dotenv").config();

const mongoConnString = process.env.MONGODB_URL;
const agenda = new Agenda({ db: { address: mongoConnString, collection: "agendaJobs" } });

// configure transporter once at module scope so startAgenda and jobs can reuse it
const transporterOptions = {
  host: process.env.SMTP_HOST || undefined,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined,
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
  },
  logger: true,
  debug: true
};
if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) {
  transporterOptions.service = 'gmail';
}
const transporter = nodemailer.createTransport(transporterOptions);

agenda.define("send task reminder", async (job) => {
  const { taskId } = job.attrs.data || {};
  if (!taskId) return;
  console.log('Agenda: running job send task reminder', { jobId: job.attrs._id, attrs: job.attrs });
  const task = await Task.findById(taskId).populate("user");
  if (!task) return;
  if (task.reminderSent) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Task Manager" <no-reply@example.com>',
    to: task.user && task.user.email ? task.user.email : undefined,
    subject: `Reminder: ${task.description ? task.description.substring(0, 40) : 'Task'}`,
    text: `Reminder for your task:\n\n${task.description || ''}\n\nScheduled at: ${task.reminderAt}`
  };

  try {
    console.log('Agenda: sending reminder', { taskId, to: mailOptions.to, transporterHost: transporterOptions.host });
    if (mailOptions.to && process.env.SMTP_USER) {
      const info = await transporter.sendMail(mailOptions);
      console.log('Agenda: email sent', { taskId, to: mailOptions.to, messageId: info && info.messageId });
    } else {
      // no SMTP configured - just log
      console.log('Reminder (no SMTP) for task', taskId, 'to user', mailOptions.to);
    }

    task.reminderSent = true;
    await task.save();
  } catch (err) {
    console.error("Agenda: failed to send reminder for task", taskId, err && err.stack ? err.stack : err);
    // If authentication error, schedule a short retry (up to 3 retries)
    try {
      const failCount = (job.attrs && job.attrs.failCount) ? job.attrs.failCount : 0;
      const isAuthError = err && (err.code === 'EAUTH' || (err.message && err.message.includes('535')));
      if (isAuthError && failCount < 3) {
        const retryAt = new Date(Date.now() + 60 * 1000); // retry in 1 minute
        await agenda.cancel({ 'data.taskId': taskId });
        await agenda.schedule(retryAt, 'send task reminder', { taskId });
        console.log(`Agenda: scheduled retry for task ${taskId} at ${retryAt.toISOString()} (failCount ${failCount})`);
      }
    } catch (retryErr) {
      console.error('Agenda: retry scheduling failed', retryErr && retryErr.stack ? retryErr.stack : retryErr);
    }
    // rethrow so Agenda marks the job as failed
    throw err;
  }
});

async function startAgenda() {
  await agenda.start();
  // verify transporter connectivity if SMTP configured
  try {
    if (process.env.SMTP_USER) {
      console.log('Agenda: verifying SMTP transporter', { host: process.env.SMTP_HOST, user: process.env.SMTP_USER, port: process.env.SMTP_PORT });
      await transporter.verify();
      console.log('Agenda: SMTP transporter verified');
    } else {
      console.log('Agenda: SMTP not configured (SMTP_USER missing) — reminders will be logged only');
    }
  } catch (err) {
    console.error('Agenda: SMTP transporter verification failed', err);
  }
}

async function listJobs(query = {}) {
  // ensure mongoose is connected
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error('MongoDB connection not ready');
  }
  // use mongoose's native db to query the agenda collection to avoid Agenda.jobs API issues
  const db = mongoose.connection.db;
  const col = db.collection('agendaJobs');
  const q = query || {};
  const docs = await col.find(q).toArray();
  return docs; // return raw docs for full inspection (debugging)
}

module.exports = { agenda, startAgenda, listJobs };

// helper for debugging: send a test email using the configured transporter
async function sendTestEmail(to) {
  const recipient = to || process.env.SMTP_USER;
  if (!recipient) throw new Error('No recipient configured for test email');
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Task Manager" <no-reply@example.com>',
    to: recipient,
    subject: 'Test Email from Task Manager',
    text: `This is a test email sent at ${new Date().toISOString()}`
  };

  // verify transporter first
  try {
    await transporter.verify();
  } catch (err) {
    const e = new Error('Transporter verification failed: ' + (err && err.message));
    e.inner = err;
    throw e;
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports.sendTestEmail = sendTestEmail;
