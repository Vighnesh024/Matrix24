import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { db, Timestamp } from "../firebase"; // <-- Make sure to import Timestamp from firestore
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const COLORS = [
  "#2563eb",
  "#d946ef",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
];

// Utility to get date N days ago as JS Date object
const daysAgoDate = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0); // start of today
  date.setDate(date.getDate() - days);
  return date;
};

export default function SubjectWisePieAnalytics() {
  const { user } = useAuth();
  const [subjectData, setSubjectData] = useState([]);
  const [filterRange, setFilterRange] = useState("7"); // default last 7 days

  useEffect(() => {
    if (!user) return;

    // Convert to Firestore Timestamp
    const startTimestamp = Timestamp.fromDate(daysAgoDate(Number(filterRange)));

    const q = query(
      collection(db, "sessions"),
      where("uid", "==", user.uid),
      where("timestamp", ">=", startTimestamp)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => doc.data());

      const grouped = {};
      sessions.forEach(({ subject, duration }) => {
        if (!subject) return;
        const dur = Number(duration) || 0;
        grouped[subject] = (grouped[subject] || 0) + dur;
      });

      const pieData = Object.entries(grouped).map(([subject, totalDuration]) => ({
        name: subject,
        value: totalDuration,
      }));

      setSubjectData(pieData);
    });

    return () => unsubscribe();
  }, [user, filterRange]);

  return (
    <div className="p-4 bg-white rounded-xl shadow mt-6">
      <h2 className="text-xl font-bold mb-4">📊 Subject-wise Analytics</h2>

      <div className="mb-4">
        <label htmlFor="dateRange" className="mr-2 font-medium">
          Show last:
        </label>
        <select
          id="dateRange"
          value={filterRange}
          onChange={(e) => setFilterRange(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
      </div>

      {subjectData.length === 0 ? (
        <p className="text-gray-500 text-center p-4">No session data available</p>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {subjectData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const minutes = Math.floor(value / 60);
                  const seconds = value % 60;
                  return `${minutes}m ${seconds}s`;
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
