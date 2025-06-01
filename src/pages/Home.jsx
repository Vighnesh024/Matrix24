import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { deleteDoc, doc } from "firebase/firestore";
import PomodoroTimer from "../components/PomodoroTimer";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Home() {
  const { user, logout } = useAuth();

  // Progress form states
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [percentage, setPercentage] = useState("");
  const [notes, setNotes] = useState("");

  // Modal & Loading states
  const [showModal, setShowModal] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // Progress list
  const [progressList, setProgressList] = useState([]);

  // --- States for Main App UI (Pomodoro Tasks) ---
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [todayFocusSeconds, setTodayFocusSeconds] = useState(0); // You can update this based on PomodoroTimer events

  // Fetch user's progress data from Firestore in realtime
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "progress"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const progressItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProgressList(progressItems);
    });

    return unsubscribe;
  }, [user]);

  // Delete progress entry handler
  const deleteProgress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this progress entry?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "progress", id));
      // onSnapshot listener will update UI automatically
    } catch (err) {
      console.error("Error deleting progress:", err);
      alert("Failed to delete progress entry.");
    }
  };

  // Simple toggle complete for tasks
  const toggleTaskComplete = (id) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  // Add a new task to the list
  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      pomodoroCount: 0,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
  };

  // Save new progress entry
  const saveProgress = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      alert("User not authenticated!");
      return;
    }

    setLoadingSave(true);

    try {
      await addDoc(collection(db, "progress"), {
        uid: user.uid,
        subject,
        topic,
        percentage: Number(percentage),
        notes,
        createdAt: new Date(),
      });

      // Clear form and close modal after saving
      setSubject("");
      setTopic("");
      setPercentage("");
      setNotes("");
      setShowModal(false);
    } catch (err) {
      console.error("Error saving progress:", err);
      alert(err.message);
    } finally {
      setLoadingSave(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-28">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.email}</h1>
        <button
          onClick={logout}
          className="text-red-600 font-semibold hover:underline"
        >
          Logout
        </button>
      </header>

      {/* Progress List */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Progress</h2>

        {progressList.length === 0 && (
          <p className="text-gray-500">No progress entries yet.</p>
        )}

        <ul className="space-y-3">
          {progressList.map(
            ({ id, subject, topic, percentage, notes, createdAt }) => (
              <li
                key={id}
                className="bg-white p-4 rounded shadow flex flex-col relative"
              >
                {/* Delete button */}
                <button
                  onClick={() => deleteProgress(id)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
                  aria-label="Delete progress entry"
                  title="Delete"
                >
                  ×
                </button>

                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-lg">{subject}</h3>
                  <span className="text-sm text-gray-500 font-semibold">
                    {percentage}%
                  </span>
                </div>
                <p className="text-gray-700 mb-1">{topic}</p>
                {notes && (
                  <p className="text-gray-600 text-sm italic">{notes}</p>
                )}
                {createdAt?.toDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    {createdAt.toDate().toLocaleString()}
                  </p>
                )}
              </li>
            )
          )}
        </ul>
      </section>

      {/* Pomodoro Timer Section */}
      <section className="mt-10">
        <PomodoroTimer />
      </section>

      {/* --- MAIN APP UI --- */}
      <div
        style={{
          maxWidth: 480,
          margin: "2rem auto",
          padding: "0 1rem",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          userSelect: "none",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 24 }}>Pomodoro Task Tracker</h1>

        {/* Analytics */}
        <section
          style={{
            marginBottom: 24,
            padding: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#f9fafb",
          }}
        >
          <h2 style={{ marginBottom: 8 }}>Today's Focus Time</h2>
          <p style={{ fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>
            {(todayFocusSeconds / 60).toFixed(1)} minutes
          </p>
        </section>

        {/* Tasks List */}
        <section>
          <h2>Tasks</h2>
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{
                  padding: 8,
                  marginBottom: 6,
                  background: task.completed ? "#d1fae5" : "#f3f4f6",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => toggleTaskComplete(task.id)}
                title="Click to toggle complete"
              >
                <span
                  style={{
                    textDecoration: task.completed ? "line-through" : "none",
                    flexGrow: 1,
                  }}
                >
                  {task.title}
                </span>
                <span
                  style={{
                    background: "#2563eb",
                    color: "white",
                    borderRadius: 12,
                    padding: "2px 8px",
                    fontSize: 12,
                    userSelect: "none",
                  }}
                  title="Pomodoros completed on this task"
                >
                  🍅 {task.pomodoroCount || 0}
                </span>
              </li>
            ))}
          </ul>

          {/* Add Task */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              type="text"
              placeholder="New task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{
                flexGrow: 1,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 16,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
            />
            <button onClick={addTask} style={buttonStyle}>
              Add
            </button>
          </div>
        </section>
      </div>

      {/* Add Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={saveProgress}
            className="bg-white w-11/12 max-w-sm p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Add Progress</h3>

            <input
              type="text"
              placeholder="Subject *"
              className="w-full p-3 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Topic"
              className="w-full p-3 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <input
              type="number"
              placeholder="Percentage Completed"
              className="w-full p-3 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />

            <textarea
              placeholder="Notes"
              className="w-full p-3 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button
              type="submit"
              disabled={loadingSave}
              className="w-full bg-pink-500 text-white py-3 rounded font-semibold hover:bg-pink-600 disabled:bg-pink-300"
            >
              {loadingSave ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-3 w-full py-2 border rounded text-center hover:bg-gray-100"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button to open modal */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-12 right-6 bg-pink-500 hover:bg-pink-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl font-bold"
        title="Add Progress"
      >
        +
      </button>
    </div>
  );
}
