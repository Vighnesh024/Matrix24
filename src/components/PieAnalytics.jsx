import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const COLORS = [
  "#2563eb", "#d946ef", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6",
];

export default function SubjectWisePieAnalytics() {
  const { user } = useAuth();
  const [subjectData, setSubjectData] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "progress"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      const grouped = {};

      data.forEach(({ subject, percentage }) => {
        if (!subject) return;
        if (!grouped[subject]) grouped[subject] = [];
        grouped[subject].push(percentage);
      });

      const pieData = Object.entries(grouped).map(([subject, percentages]) => {
        // Calculate average percentage per subject
        const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
        return {
          name: subject,
          value: avg,
        };
      });

      setSubjectData(pieData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="p-4 bg-white rounded-xl shadow mt-6">
      <h2 className="text-xl font-bold mb-4">📊 Subject-wise Analytics</h2>

      {subjectData.length === 0 ? (
        <p className="text-gray-500 text-center p-4">No progress data available</p>
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
                label={({ payload, percent }) =>
                  `${payload.name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {subjectData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
