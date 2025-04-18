import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  orderBy
} from "firebase/firestore";
import GoalSetup from "./GoalSetup";
import WeightGoalCard from "./WeightGoalCard";
import WeightDailyTargetCard from "./WeightDailyTargetCard";
import WeightLogCard from "./WeightLogCard";

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">{children}</div>
);

export default function WeightControl({ user }) {
  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [dailyTargets, setDailyTargets] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const goalRef = doc(db, "users", user.uid, "weight", "goal");
    const logsRef = collection(db, "users", user.uid, "weightLogs");

    const unsubGoal = onSnapshot(goalRef, (snap) => {
      if (snap.exists()) {
        const goalData = snap.data();
        setGoal(goalData);

        // генерируем цели на каждый день
        const days = [];
        const start = new Date(goalData.startDate);
        const end = new Date(goalData.endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalDelta = goalData.startWeight - goalData.goalWeight;

        for (let i = 0; i <= totalDays; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const expected = goalData.startWeight - (totalDelta / totalDays) * i;
          const isoDate = date.toISOString().split("T")[0];
          const log = logs.find((l) => l.date === isoDate);
          days.push({
            date: isoDate,
            expected,
            actual: log?.weight,
          });
        }
        setDailyTargets(days);
      } else {
        setGoal(null);
        setDailyTargets([]);
      }
    });

    const unsubLogs = onSnapshot(
      query(logsRef, orderBy("timestamp", "desc")),
      (snap) => {
        const logsData = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date
        }));
        setLogs(logsData);
      }
    );

    return () => {
      unsubGoal();
      unsubLogs();
    };
  }, [user]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎯 Контроль веса</h1>

      {/* Установка цели */}
      <GoalSetup user={user} currentGoal={goal} />

      {/* Цель (если задана) */}
      {goal && (
        <>
          <WeightGoalCard data={goal} />
          <WeightDailyTargetCard
            data={dailyTargets}
            currentWeight={logs?.[0]?.weight || goal.startWeight}
            startWeight={goal.startWeight}
            goalWeight={goal.goalWeight}
          />
          <WeightLogCard user={user} logs={logs} />
        </>
      )}
    </div>
  );
}
