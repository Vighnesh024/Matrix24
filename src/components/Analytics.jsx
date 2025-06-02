import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  const [subjectStats, setSubjectStats] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "progress"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      const grouped = {};

      data.forEach(entry => {
        const { subject, percentage } = entry;
        if (!grouped[subject]) grouped[subject] = [];
        grouped[subject].push(percentage);
      });

      const stats = Object.entries(grouped).map(([subject, percentages]) => ({
        subject,
        average: (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1),
      }));

      setSubjectStats(stats);
    });

    return unsubscribe;
  }, [user]);

  return (
    <div className="mt-10 bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">📊 Subject-wise Analytics</h2>

      {subjectStats.length === 0 ? (
        <p className="text-gray-500">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="average" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
