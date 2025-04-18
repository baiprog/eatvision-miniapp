import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export default function GoalSetup({ user, onSaved }) {
  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const handleSave = async () => {
    if (!user?.uid || !startWeight || !targetWeight || !goalDate) return;

    const ref = doc(db, "users", user.uid, "weightGoals", "current");
    await setDoc(ref, {
      startWeight: parseFloat(startWeight),
      targetWeight: parseFloat(targetWeight),
      goalDate,
      createdAt: serverTimestamp(),
    });

    if (onSaved) onSaved();
  };

  return (
    <div className="p-4 border rounded-xl bg-white shadow-md">
      <h2 className="text-lg font-bold mb-3">🎯 Цель по весу</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Текущий вес (кг)</label>
          <input
            type="number"
            value={startWeight}
            onChange={(e) => setStartWeight(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Целевой вес (кг)</label>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Дата достижения цели</label>
          <input
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-3 w-full bg-black text-white py-2 rounded-lg font-semibold"
        >
          ✅ Сохранить цель
        </button>
      </div>
    </div>
  );
}
