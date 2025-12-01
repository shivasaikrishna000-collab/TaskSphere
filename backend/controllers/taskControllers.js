const Task = require("../models/Task");
const { validateObjectId } = require("../utils/validation");
const { agenda } = require("../utils/agenda");


exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.status(200).json({ tasks, status: true, msg: "Tasks found successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.getTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    const task = await Task.findOne({ user: req.user.id, _id: req.params.taskId });
    if (!task) {
      return res.status(400).json({ status: false, msg: "No task found.." });
    }
    res.status(200).json({ task, status: true, msg: "Task found successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.postTask = async (req, res) => {
  try {
    const { description, reminderAt } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }

    const task = await Task.create({ user: req.user.id, description, reminderAt: reminderAt || null, reminderSent: false });

    // schedule reminder if a valid future date
    if (task.reminderAt && new Date(task.reminderAt) > new Date()) {
      await agenda.cancel({ "data.taskId": task._id.toString() });
      await agenda.schedule(new Date(task.reminderAt), "send task reminder", { taskId: task._id.toString() });
      console.log(`Agenda: scheduled reminder for task ${task._id} at ${task.reminderAt}`);
    }

    res.status(200).json({ task, status: true, msg: "Task created successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.putTask = async (req, res) => {
  try {
    const { description, reminderAt } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }

    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(400).json({ status: false, msg: "Task with given id not found" });
    }

    if (task.user != req.user.id) {
      return res.status(403).json({ status: false, msg: "You can't update task of another user" });
    }

    task = await Task.findByIdAndUpdate(req.params.taskId, { description, reminderAt: reminderAt || null }, { new: true });

    // reschedule reminder: cancel previous jobs and schedule if needed
    await agenda.cancel({ "data.taskId": task._id.toString() });
    if (task.reminderAt && new Date(task.reminderAt) > new Date() && !task.reminderSent) {
      await agenda.schedule(new Date(task.reminderAt), "send task reminder", { taskId: task._id.toString() });
      console.log(`Agenda: rescheduled reminder for task ${task._id} at ${task.reminderAt}`);
    }

    res.status(200).json({ task, status: true, msg: "Task updated successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}


exports.deleteTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(400).json({ status: false, msg: "Task with given id not found" });
    }

    if (task.user != req.user.id) {
      return res.status(403).json({ status: false, msg: "You can't delete task of another user" });
    }

    // cancel scheduled job for this task
    try { await agenda.cancel({ "data.taskId": req.params.taskId.toString() }); } catch (e) { console.error('Agenda cancel error', e); }
    await Task.findByIdAndDelete(req.params.taskId);
    res.status(200).json({ status: true, msg: "Task deleted successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}