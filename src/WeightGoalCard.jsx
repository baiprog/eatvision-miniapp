import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function WeightGoalCard({ user }) {
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    const fetchGoal = async () => {
      if (!user?.uid) return;
      const ref = doc(db, "users", user.uid, "weightGoals", "current");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setGoal(snap.data());
      }
    };
    fetchGoal();
  }, [user]);

  if (!goal) return null;

  const startDate = new Date(goal.startDate);
  const endDate = new Date(goal.endDate);
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalLoss = goal.startWeight - goal.targetWeight;
  const dailyLoss = days > 1 ? (totalLoss / (days - 1)).toFixed(2) : totalLoss.toFixed(2);

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="font-bold text-lg mb-2">🎯 Цель</div>
      <p className="text-sm text-gray-700 leading-relaxed">
        Вес сейчас: <b>{goal.startWeight} кг</b><br />
        Цель: <b>{goal.targetWeight} кг</b> к <b>{endDate.toLocaleDateString()}</b><br />
        Продолжительность: <b>{days} дней</b><br />
        Цель в день: <b>−{dailyLoss} кг/день</b>
      </p>
    </div>
  );
}