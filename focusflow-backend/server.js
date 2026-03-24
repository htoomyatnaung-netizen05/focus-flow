import express from 'express';
import cors from 'cors';
// const fetch = require('node-fetch')
import { InferenceClient } from "@huggingface/inference";
import 'dotenv/config';

const server = express() 
const port = 5000 

server.use(cors()) 
server.use(express.json()) 

let tasks = []; 

const hf = new InferenceClient(process.env.HF_API_TOKEN);

const generateScheduleAI = async (taskList) => {
  const taskStrings = taskList.map(t => t.text).join(", ");

  try {
    
    const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [
        {
        role: "system",
        content: `
              You are an intelligent daily planning assistant.

              Your job is to:
              1. Analyze each task deeply
              2. Assign priority (health, study, work > leisure)
              3. Decide realistic duration (15 min to 3 hours depending on task)
              4. Place tasks at natural times of day
              5. Balance energy (don’t stack heavy tasks together)
              6. Recalculate the FULL schedule every time

              Scheduling rules:
              - Tasks can have different durations (NOT fixed 1 hour)
              - Use realistic time slots (e.g., 07:30, 09:15, 14:45)
              - Short tasks → 15–30 mins
              - Medium tasks → 45–90 mins
              - Deep work → 1.5–3 hours
              - Avoid overlaps
              - Respect common sense:
              - Sleep → night
              - Wake up → morning
              - Gym → morning or evening
              - Study → morning or afternoon focus hours

              - Use 12-hour clock format

              [
                {
                  "task": "...",
                  "schedule": "Morning/Afternoon/Evening/Night",
                  "time": "HH:MM - HH:MM",
                  "duration_minutes": number
                }
              ]

              Return ONLY a valid JSON array.
              No explanation. No markdown.
              `
        },
        {
          role: "user",
          content: `Create a realistic daily schedule for these tasks:
          ${taskStrings}`
        }
        ],
        temperature: 0.3,
        max_tokens: 700
    });

    const text = response.choices[0].message.content;
    console.log("AI Response Raw:", text);

    const match = text.match(/\[\s*{[\s\S]*?}\s*\]/);

    if (match) {
      try {
        const parsed = JSON.parse(match[0]);

        return taskList.map((task) => {
        const found = parsed.find(p => 
          p.task.toLowerCase().includes(task.text.toLowerCase())
        );

        return {
          schedule: found?.schedule,
          time: found?.time,
          duration: found?.duration_minutes
        };
      });

      } catch (parseErr) {
          console.error("JSON Parsing failed:", parseErr);
      }
    }

    return taskList.map((t) => ({
      schedule: t.text,
      time: "09:00-10:00"
    }));

  } catch (err) {
    console.error("AI Generation Error (HF SDK):", err.message);
    
    if (err.message.includes("currently loading")) {
      console.log("Model is warming up, please retry in 20s.");
    }

    return taskList.map(() => ({
      schedule: "Error Fallback",
      time: "00:00-00:00"
    }));
  }
};

server.get('/', (req, res) => {
    res.send("FocusFlow Server is running!");
})

server.get('/tasks', (req, res) => {
    res.json(tasks)
})

server.post('/tasks', (req, res) => {
    if (!req.body || !req.body.text) {
        return res.status(400).json("Task text is required");
    }

    const task = {
        id: Date.now(),
        text: req.body.text,
        completed: false,
        schedule: "Pending", 
        time: "Pending",
        durationMinute: "Pending"
    }

    tasks.push(task)
    res.json("New Task has been added")

    console.log(task)
})

server.post('/generateTasks', async (req, res) => {
    if (tasks.length === 0) return res.status(400).json("No tasks to generate");

    const aiResults = await generateScheduleAI(tasks);

    console.log(aiResults)

    // Update the existing tasks with AI results
    tasks = tasks.map((task, index) => ({
        ...task,
        schedule: aiResults[index]?.schedule,
        time: aiResults[index]?.time,
        duration: aiResults[index]?.duration
    }));

    res.json("Schedule generated for all tasks");
});

server.delete('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    tasks = tasks.filter(t => t.id !== id);

    res.json("Task has been deleted")
})

server.patch('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);

  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );

  res.json("Task Completed");
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})