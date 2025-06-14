import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import useSound from "use-sound";
import endSound from "../assets/complete.mp3"; // Provide your own sound file here

export default function PomodoroApp() {
  // Timer States
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);
  const [play] = useSound(endSound);

  // Timer Drag & Lock
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);
  const [visible, setVisible] = useState(true);

  // Pomodoro Sessions & Tasks
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Load sessions and tasks from localStorage on mount
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem("pomodoro_sessions")) || [];
    setSessions(savedSessions);

    const savedTasks = JSON.parse(localStorage.getItem("pomodoro_tasks")) || [];
    setTasks(savedTasks);
  }, []);

  // Save sessions to localStorage whenever sessions state changes
  useEffect(() => {
    localStorage.setItem("pomodoro_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Save tasks to localStorage whenever tasks state changes
  useEffect(() => {
    localStorage.setItem("pomodoro_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Timer countdown logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          confetti();
          play();
          notifyUser(isBreak ? "Break Over!" : "Pomodoro Complete!", {
            body: isBreak ? "Time to focus now." : "Time for a break!",
          });
          saveSession(isBreak ? "break" : "work", isBreak ? breakTime * 60 : workTime * 60, selectedTaskId);
          if (!isBreak && selectedTaskId) incrementTaskPomodoro(selectedTaskId);
          setIsBreak((b) => !b);
          setTimeLeft((b) => (!isBreak ? breakTime * 60 : workTime * 60));
          setIsRunning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak, workTime, breakTime, play, selectedTaskId]);

  // Reset timeLeft when workTime or breakTime or isBreak changes
  useEffect(() => {
    setTimeLeft(isBreak ? breakTime * 60 : workTime * 60);
  }, [workTime, breakTime, isBreak]);

  // Format seconds to mm:ss
  function formatTime(t) {
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  }

  // Save completed session
  function saveSession(type, duration, taskId = null) {
    const newSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      type,
      duration,
      taskId,
    };
    setSessions((prev) => [...prev, newSession]);
  }

  // Increment pomodoro count on task
  function incrementTaskPomodoro(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pomodoroCount: (t.pomodoroCount || 0) + 1 } : t))
    );
  }

  // Add new task
  function addTask() {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      pomodoroCount: 0,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
  }

  // Toggle task complete
  function toggleTaskComplete(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  // Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  function notifyUser(title, options) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, options);
    }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  // Drag handlers
  function handlePointerDown(e) {
    if (isLocked) return;
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setPos((prev) => ({
      x: Math.min(Math.max(prev.x + dx, 0), window.innerWidth - 200),
      y: Math.min(Math.max(prev.y + dy, 0), window.innerHeight - 200),
    }));
  }

  function handlePointerUp() {
    setDragging(false);
  }

  // Analytics - total focus time today
  const today = new Date().toISOString().slice(0, 10);
  const todayFocusSeconds = sessions
    .filter((s) => s.date === today && s.type === "work")
    .reduce((acc, s) => acc + s.duration, 0);

  return (
    <>
      {/* Show/Hide Button */}
      {!visible && (
        <button
  onClick={() => setVisible(true)}
  className="fixed bottom-28 right-8 bg-pink-500 hover:bg-pink-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition duration-300 active:scale-95 z-40"
  title="Start Pomodoro Timer"
>
  ⏱️
</button>

      )}

      {/* Pomodoro Timer */}
      {visible && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            width: 200,
            background: "white",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            userSelect: "none",
            touchAction: "none",
            cursor: isLocked ? "default" : dragging ? "grabbing" : "grab",
            transition: dragging ? "none" : "left 0.2s, top 0.2s",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {/* Lock toggle left */}
            <button
              onClick={() => setIsLocked((l) => !l)}
              style={{
                background: isLocked ? "#ec4899" : "#9ca3af",
                border: "none",
                borderRadius: 8,
                width: 28,
                height: 28,
                color: "white",
                cursor: "pointer",
              }}
              title={isLocked ? "Unlock Timer" : "Lock Timer"}
            >
              {isLocked ? "🔒" : "🔓"}
            </button>

            <div>{isBreak ? "Break Time" : "Focus Time"}</div>

            {/* Close button right */}
            <button
              onClick={() => setVisible(false)}
              style={{
                background: "#ef4444",
                border: "none",
                borderRadius: 8,
                width: 28,
                height: 28,
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              title="Hide Timer"
            >
              ×
            </button>
          </div>

          {/* Timer Display */}
          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
              fontFamily: "monospace",
              color: isBreak ? "#d946ef" : "#2563eb",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                style={buttonStyle}
                aria-label="Pause Timer"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(true)}
                style={buttonStyle}
                aria-label="Start Timer"
              >
                Start
              </button>
            )}
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(isBreak ? breakTime * 60 : workTime * 60);
              }}
              style={buttonStyle}
              aria-label="Reset Timer"
            >
              Reset
            </button>
          </div>

          {/* Timer Length Settings */}
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#6b7280",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <label>
              Work:
              <input
                type="number"
                min={1}
                max={60}
                value={workTime}
                onChange={(e) => setWorkTime(Math.min(Math.max(+e.target.value, 1), 60))}
                style={inputStyle}
              />{" "}
              min
            </label>
            <label>
              Break:
              <input
                type="number"
                min={1}
                max={30}
                value={breakTime}
                onChange={(e) => setBreakTime(Math.min(Math.max(+e.target.value, 1), 30))}
                style={inputStyle}
              />{" "}
              min
            </label>
          </div>

          {/* Select Task for Pomodoro */}
          <div style={{ marginTop: 12 }}>
            <label htmlFor="task-select" style={{ fontSize: 12, color: "#374151" }}>
              Assign To Task:
            </label>
            <select
              id="task-select"
              value={selectedTaskId || ""}
              onChange={(e) => setSelectedTaskId(e.target.value || null)}
              style={{ width: "100%", marginTop: 4, padding: 4, borderRadius: 4 }}
            >
              <option value="">-- None --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.completed ? "(Done)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}

const buttonStyle = {
  background: "#ec4899",
  border: "none",
  color: "white",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
  userSelect: "none",
};

const inputStyle = {
  width: 40,
  marginLeft: 4,
  padding: 2,
  fontSize: 14,
  borderRadius: 4,
  border: "1px solid #d1d5db",
  textAlign: "center",
};
