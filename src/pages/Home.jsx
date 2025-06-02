import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { deleteDoc, doc } from "firebase/firestore";
import PomodoroTimer from "../components/PomodoroTimer";
import Analytics from '../components/Analytics.jsx';
import PieAnalytics from '../components/PieAnalytics.jsx'; 

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
  const [understanding, setUnderstanding] = useState(3); // slider value

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
        understanding: Number(understanding), // Save understanding
        createdAt: new Date(),
      });

      // Clear form and close modal after saving
      setSubject("");
      setTopic("");
      setPercentage("");
      setNotes("");
      setUnderstanding(3); // reset slider
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

  // Emoji array for understanding level
  const understandingEmojis = ["😕", "😐", "🙂", "😃", "🤓"];

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-28 max-w-screen-lg mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold text-gray-800 break-words">Welcome, {user.email}</h1>
        <button
          onClick={logout}
          className="text-red-600 font-semibold hover:underline"
        >
          Logout
        </button>
      </header>

      {/* Progress List */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Progress</h2>

        {progressList.length === 0 ? (
          <p className="text-gray-500">No progress entries yet.</p>
        ) : (
          <ul className="space-y-3">
            {progressList.map(({ id, subject, topic, percentage, notes, createdAt, understanding }) => (
              <li
                key={id}
                className="bg-white p-4 rounded shadow flex flex-col relative break-words"
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

                <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">{subject}</h3>
                  <span className="text-sm text-gray-500 font-semibold">{percentage}%</span>
                </div>
                <p className="text-gray-700 mb-1">{topic}</p>
                {notes && <p className="text-gray-600 text-sm italic">{notes}</p>}
                {typeof understanding === "number" && (
                  <div
                    className="text-xl mt-1"
                    title={`Understanding level: ${understanding}`}
                  >
                    {understandingEmojis[understanding - 1]}
                  </div>
                )}
                {createdAt?.toDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    {createdAt.toDate().toLocaleString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pomodoro Timer Section */}
      <section className="mb-10">
        <PomodoroTimer />
      </section>

      {/* MAIN APP UI */}
      <div
        className="mx-auto w-full max-w-xl px-4 select-none font-sans"
        style={{ userSelect: "none" }}
      >
        <h1 className="text-center mb-6 text-xl sm:text-2xl font-semibold">Pomodoro Task Tracker</h1>

        {/* Analytics */}
        <section
          className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 text-center"
          aria-label="Today's Focus Time"
        >
          <h2 className="mb-2 font-semibold text-gray-700">Today's Focus Time</h2>
          <p className="text-2xl font-bold text-blue-600">
            {(todayFocusSeconds / 60).toFixed(1)} minutes
          </p>
        </section>

        {/* Responsive Analytics Container */}
        <section className="flex flex-col sm:flex-row sm:space-x-6 gap-6 mb-10">
          <div className="flex-1 min-w-0">
            <Analytics />
          </div>
          <div className="flex-1 min-w-0">
            <PieAnalytics />
          </div>
        </section>

        {/* Tasks List */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Tasks</h2>
          <ul className="p-0 list-none">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`p-2 mb-2 rounded flex justify-between items-center cursor-pointer 
                  ${task.completed ? "bg-green-100" : "bg-gray-100"}`}
                onClick={() => toggleTaskComplete(task.id)}
                title="Click to toggle complete"
              >
                <span
                  className={`flex-grow truncate ${task.completed ? "line-through" : ""}`}
                >
                  {task.title}
                </span>
                <span
                  className="bg-blue-600 text-white rounded-full px-2 text-xs select-none"
                  title="Pomodoros completed on this task"
                >
                  🍅 {task.pomodoroCount || 0}
                </span>
              </li>
            ))}
          </ul>

          {/* Add Task */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="New task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              className="flex-grow p-2 border border-gray-300 rounded text-base"
              aria-label="New task title"
            />
            <button
              onClick={addTask}
              style={buttonStyle}
              aria-label="Add task"
            >
              Add
            </button>
          </div>
        </section>
      </div>

      {/* Add Progress Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <form
            onSubmit={saveProgress}
            className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-4"
          >
            <h3 id="modal-title" className="text-xl font-semibold text-gray-800">
              📈 Add Progress
            </h3>

            {/* Subject Dropdown */}
            <select
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Select Subject *</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Math">Math</option>
            </select>

            {/* Topic (optional) */}
            <input
              type="text"
              placeholder="Topic (optional)"
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            {/* % Completed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage Completed
              </label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="0 - 100"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>

            {/* Understanding (Slider) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Understanding Level
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={understanding}
                onChange={(e) => setUnderstanding(e.target.value)}
                className="w-full"
              />
              <div className="text-center text-lg mt-1">
                {understandingEmojis[understanding - 1]}
              </div>
            </div>

            {/* Notes (optional) */}
            <textarea
              placeholder="Notes (optional)"
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* Save Button */}
            <button
              type="submit"
              disabled={loadingSave}
              className="w-full bg-pink-500 text-white py-3 rounded font-semibold hover:bg-pink-600 disabled:bg-pink-300 transition"
            >
              {loadingSave ? "Saving..." : "Save Progress"}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full text-center text-pink-600 font-semibold mt-2 hover:underline"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="Add progress"
        className="fixed bottom-8 right-8 bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-700 transition focus:outline-none focus:ring-2 focus:ring-pink-500"
      >
        +
      </button>
    </div>
  );
}