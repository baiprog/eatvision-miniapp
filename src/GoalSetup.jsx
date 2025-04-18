import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export default function GoalSetup({ user, onUpdate }) {
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const fetchGoal = async () => {
      const ref = doc(db, "users", user.uid, "weightGoal", "current");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCurrentWeight(data.currentWeight || "");
        setTargetWeight(data.targetWeight || "");
        setTargetDate(data.targetDate || "");
      }
    };

    fetchGoal();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid || !targetWeight || !targetDate || !currentWeight) return;

    try {
      await setDoc(doc(db, "users", user.uid, "weightGoal", "current"), {
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        targetDate,
        createdAt: serverTimestamp(),
      });

      if (onUpdate) onUpdate(); // триггерим обновление в WeightControl
    } catch (e) {
      console.error("Ошибка при сохранении цели:", e);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow mb-4">
      <h2 className="text-lg font-bold mb-3">🎯 Моя цель</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Текущий вес (кг)</label>
          <input
            type="number"
            value={currentWeight}
            onChange={(e) => setCurrentWeight(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Целевой вес (кг)</label>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Целевая дата</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 w-full bg-black text-white rounded-xl py-2 text-sm font-medium"
      >
        ✅ Сохранить цель
      </button>
    </div>
  );
}
