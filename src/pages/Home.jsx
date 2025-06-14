  import { useEffect, useState } from "react";
  import { useAuth } from "../contexts/AuthContext";
  import toast from 'react-hot-toast';
  import { orderBy } from "firebase/firestore";
  import { motion, AnimatePresence } from 'framer-motion';
  import PomodoroTimer from "../components/PomodoroTimer";
  import Analytics from '../components/Analytics.jsx';
  import PieAnalytics from '../components/PieAnalytics.jsx';

  import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
  } from "firebase/firestore";

  import { db } from "../firebase.js";

  export default function Home() {
    const { user, logout } = useAuth();

    // Progress form states
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [percentage, setPercentage] = useState("");
    const [notes, setNotes] = useState("");
    const [understanding, setUnderstanding] = useState(3);

    // Modal & Loading states
    const [showModal, setShowModal] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    // Progress list
    const [progressList, setProgressList] = useState([]);

    // To-Do List
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // ✅ Load tasks from localStorage (per user)
    useEffect(() => {
      if (user) {
        const stored = localStorage.getItem(`tasks-${user.uid}`);
        if (stored) {
          try {
            setTasks(JSON.parse(stored));
          } catch (err) {
            console.error("Error loading tasks:", err);
          }
        }
      }
    }, [user]);

    // ✅ Save tasks to localStorage (per user)
    useEffect(() => {
      if (user) {
        localStorage.setItem(`tasks-${user.uid}`, JSON.stringify(tasks));
      }
    }, [tasks, user]);

    // Fetch progress data from Firestore
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

    const deleteProgress = async (id) => {
      if (!window.confirm("Delete this progress entry?")) return;
      try {
        await deleteDoc(doc(db, "progress", id));
      } catch (err) {
        console.error("Error deleting progress:", err);
        alert("Failed to delete progress entry.");
      }
    };

    const toggleTaskComplete = (id) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    };

    const removeTask = (id) => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    };

    const addTask = () => {
      if (!newTaskTitle.trim()) return;

      const newTask = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
      };
      setTasks((prev) => [newTask, ...prev]);
      setNewTaskTitle("");
    };

    const saveProgress = async (e) => {
      e.preventDefault();
      if (!user?.uid) return alert("User not authenticated!");

      setLoadingSave(true);

      try {
        await addDoc(collection(db, "progress"), {
          uid: user.uid,
          subject,
          topic,
          percentage: Number(percentage),
          notes,
          understanding: Number(understanding),
          createdAt: new Date(),
        });

        setSubject("");
        setTopic("");
        setPercentage("");
        setNotes("");
        setUnderstanding(3);
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

    const understandingEmojis = ["😕", "😐", "🙂", "😃", "🤓"];

    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-28 max-w-screen-lg mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 break-words">Welcome, {user.email}</h1>
          <button onClick={logout} className="text-red-600 font-semibold hover:underline">Logout</button>
        </header>

        {/* Analytics */}
        <section className="flex flex-col sm:flex-row sm:space-x-6 gap-6 mb-10">
          <div className="flex-1 min-w-0"><Analytics /></div>
          <div className="flex-1 min-w-0"><PieAnalytics /></div>
        </section>

        {/* Progress */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          {progressList.length === 0 ? (
            <p className="text-gray-500">No progress entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {progressList.map(({ id, subject, topic, percentage, notes, createdAt, understanding }) => (
                <li key={id} className="bg-white p-4 rounded shadow flex flex-col relative break-words">
                  <button
                    onClick={() => deleteProgress(id)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold"
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
                    <div className="text-xl mt-1" title={`Understanding level: ${understanding}`}>
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

        {/* Pomodoro */}
        <section className="mb-10">
          <PomodoroTimer />
        </section>

        {/* To-Do List */}
        <section className="mb-10 max-w-xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">To-Do List</h2>
          <ul className="p-0 list-none mb-4">
            {tasks.length === 0 && <p className="text-center text-gray-500">No tasks added yet.</p>}
            {tasks.map((task) => (
              <li key={task.id} className={`p-3 mb-2 rounded flex justify-between items-center cursor-pointer ${task.completed ? "bg-green-100 line-through text-gray-600" : "bg-gray-100"}`}>
                <span onClick={() => toggleTaskComplete(task.id)}>{task.title}</span>
                <button onClick={() => removeTask(task.id)} className="text-red-600 hover:text-red-800 font-bold ml-4">×</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              className="flex-grow p-3 border border-gray-300 rounded text-base"
            />
            <button onClick={addTask} style={buttonStyle}>Add</button>
          </div>
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <form
              onSubmit={saveProgress}
              className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-4"
            >
              <h3 className="text-xl font-semibold text-gray-800">📈 Add Progress</h3>

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

              <input
                type="text"
                placeholder="Topic (optional)"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage Completed</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Understanding Level</label>
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

              <textarea
                placeholder="Notes (optional)"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button
                type="submit"
                disabled={loadingSave}
                className="w-full bg-pink-500 text-white py-3 rounded font-semibold hover:bg-pink-600 disabled:bg-pink-300 transition"
              >
                {loadingSave ? "Saving..." : "Save Progress"}
              </button>

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
  className="fixed bottom-8 right-8 bg-pink-500 hover:bg-pink-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl transition duration-300 active:scale-95 z-40"
  title="Add Progress"
>
  +
</button>


      </div>
    );
  }
