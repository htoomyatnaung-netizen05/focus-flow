import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function App() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:5000/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (task.trim() === "") return;

    try {
        const res = await fetch("http://localhost:5000/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({text: task})
        });
        
        if(res.ok){
          setTask("");
          await fetchTasks();
        }
        await res.json();
    } catch (error) {
        console.error("Post Error:", error);
    }
  };

  const deleteTask = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "DELETE"
    });
    await fetchTasks();
  };

  const completeFun = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PATCH"
    });
    await fetchTasks();
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:5000/generateTasks", {
        method: "POST",
      });
      if (res.ok) {
        await fetchTasks();
        setScheduleStatus(true);
      }
    } catch (error) {
      console.error("Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 antialiased">
      <div className="flex flex-col lg:flex-row gap-12 w-full max-w-7xl items-start justify-center">
        {/* Left side: Task Entry */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm mb-4 border border-slate-100">
                <ClipboardList size={20} className="text-indigo-600" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Workspace
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Organize your daily priorities
              </p>
            </div>
            <div className="self-start mt-2">
              <span className="text-xl tracking-tighter font-black italic">
                <span className="text-slate-900">Focus</span>
                <span className="text-indigo-600">Flow</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200/60 relative overflow-hidden group">
            <form onSubmit={submitForm} className="relative z-10 mb-8">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                New Task
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  required
                  onChange={(e) => setTask(e.target.value)}
                  value={task}
                  className="flex-1 bg-slate-50 border-none px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white px-4 rounded-xl transition-all active:scale-90 shadow-md"
                >
                  <Plus size={20} />
                </button>
              </div>
            </form>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="text-slate-200" size={20} />
                  </div>
                  <p className="text-slate-400 text-sm italic">
                    Clear sky. No tasks ahead.
                  </p>
                </div>
              ) : (
                [...tasks]
                  .sort((a, b) => a.completed - b.completed)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between py-3 px-4 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                          <div
                            className={`w-2 h-2 rounded-sm bg-indigo-500 transition-opacity ${t.completed ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
                          />
                        </div>
                        <span
                          className={`text-[15px] transition-all truncate max-w-45 ${t.completed ? "text-slate-300 line-through" : "text-slate-600 group-hover:text-slate-900"}`}
                        >
                          {t.text}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-slate-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white rounded-lg shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={generateSchedule}
                disabled={tasks.length === 0 || isGenerating}
                className="w-full bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                {isGenerating ? "AI Thinking..." : "Generate Schedule"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Timeline & Progress */}
        {scheduleStatus && (
          <div className="w-full lg:flex-1 flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-50 rounded-2xl mb-4">
                <Clock size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Timeline
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                Suggested routine based on tasks
              </p>
            </div>

            {/* FIXED HEADER TABLE */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 overflow-hidden flex flex-col mt-2">
              <div className="overflow-y-auto max-h-100">
                <table className="w-full table-fixed min-w-125 border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                    <tr>
                      <th className="w-[45%] px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Activity
                      </th>
                      <th className="w-[20%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Session
                      </th>
                      <th className="w-[20%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Time
                      </th>
                      <th className="w-[20%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Duration
                      </th>
                      <th className="w-[15%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Done
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tasks.map((t) => (
                      <tr key={t.id} className={`group hover:bg-slate-50/80 transition-colors ${t.completed ? "bg-slate-50/30" : ""}`}>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium truncate block ${t.completed ? "line-through text-slate-300" : "text-slate-700"}`}>
                            {t.text}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border inline-block whitespace-nowrap ${t.schedule === "Morning" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}>
                            {t.schedule}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                            {t.time}
                            {console.log(typeof(t.time))}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                            {t.duration >= 60 ? `${t.duration / 60} hr` : `${t.duration} min`}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={t.completed}
                              onChange={() => completeFun(t.id)} 
                              className="w-5 h-5 accent-indigo-600 cursor-pointer rounded border-slate-300"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-slate-600">Task Completion</span>
                <span className="text-sm font-bold text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progress === 100 ? "bg-green-500" : "bg-indigo-600"} transition-all duration-700 ease-out`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-400 font-medium">
                  {completedCount} of {totalCount} tasks completed
                </p>
                {progress === 100 && (
                  <span className="text-green-500 text-xs font-bold">Perfect Score! 🎉</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}