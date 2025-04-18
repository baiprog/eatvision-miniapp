import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const Card = ({ children }) => (
  <div className="bg-white border rounded-2xl shadow p-4 mb-4">{children}</div>
);

export default function WeightControl({ user }) {
  const [targetWeight, setTargetWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [deadline, setDeadline] = useState("");
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "weights"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(data);
    });

    return () => unsubscribe();
  }, [user]);

  const saveGoal = async () => {
    if (!user?.uid || !targetWeight || !deadline) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, {
      weightGoal: targetWeight,
      deadline,
    }, { merge: true });
    alert("🎯 Цель сохранена");
  };

  const addWeight = async () => {
    if (!user?.uid || !currentWeight) return;
    await addDoc(collection(db, "users", user.uid, "weights"), {
      weight: parseFloat(currentWeight),
      createdAt: serverTimestamp(),
    });
    setCurrentWeight("");
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚖️ Контроль веса</h1>

      <Card>
        <h2 className="font-semibold mb-2">🎯 Цель</h2>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            placeholder="Целевой вес, кг"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={saveGoal}
            className="bg-black text-white rounded-xl px-4 py-2 text-sm"
          >
            Сохранить цель
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">📥 Ввести текущий вес</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Например, 83.6"
            value={currentWeight}
            onChange={(e) => setCurrentWeight(e.target.value)}
            className="border flex-1 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={addWeight}
            className="bg-black text-white rounded-xl px-4 py-2 text-sm"
          >
            OK
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">📊 История взвешиваний</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">Нет данных</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {entries.map((entry) => (
              <li key={entry.id} className="flex justify-between border-b pb-1">
                <span>{entry.createdAt?.toDate?.().toLocaleString()}</span>
                <span className="font-medium">{entry.weight} кг</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
