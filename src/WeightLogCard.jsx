// src/WeightLogCard.jsx

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export default function WeightLogCard({ user, dailyTarget }) {
  const [currentWeight, setCurrentWeight] = useState("");
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "weights"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(data);
    });

    return () => unsub();
  }, [user]);

  const handleLogWeight = async () => {
    if (!user?.uid || !currentWeight) return;

    const weight = parseFloat(currentWeight);
    if (isNaN(weight)) return alert("Введите корректный вес");

    await addDoc(collection(db, "users", user.uid, "weights"), {
      weight,
      createdAt: serverTimestamp(),
    });

    // Генерация совета от GPT (псевдо, можно заменить запросом)
    const now = new Date();
    const hour = now.getHours();
    const target = hour < 17 ? dailyTarget?.morning : dailyTarget?.evening;

    if (target) {
      const diff = target - weight;
      if (diff > 0.5) {
        setFeedback("Вы можете сегодня позволить себе перекус или десерт 🍌");
      } else if (diff > 0) {
        setFeedback("Почти достигли цели, можно немного прогуляться 🚶");
      } else {
        setFeedback("Вы уже перевыполнили план! Отличная работа 🔥");
      }
    }

    setCurrentWeight("");
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow mb-4">
      <div className="text-lg font-bold mb-2">⚖️ Взвешивания</div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          step="0.1"
          placeholder="Текущий вес"
          value={currentWeight}
          onChange={(e) => setCurrentWeight(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm w-full"
        />
        <button
          onClick={handleLogWeight}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm"
        >
          Взвеситься
        </button>
      </div>

      {feedback && (
        <p className="text-sm text-green-600 font-medium mb-2">{feedback}</p>
      )}

      <div className="text-sm text-gray-500 mb-1">📅 История:</div>
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex justify-between border rounded-xl px-3 py-2 text-sm text-gray-700"
          >
            <span>{log.weight} кг</span>
            <span className="text-gray-400">
              {log.createdAt?.toDate?.().toLocaleString?.()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
