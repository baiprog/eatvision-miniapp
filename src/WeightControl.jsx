import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import GoalSetup from "./GoalSetup";
import WeightGoalCard from "./WeightGoalCard";
import WeightLogCard from "./WeightLogCard";
import WeightDailyTargetCard from "./WeightDailyTargetCard";

export default function WeightControl({ user }) {
  const [weightLogs, setWeightLogs] = useState([]);
  const [goal, setGoal] = useState(null);

  const fetchData = async () => {
    if (!user?.uid) return;

    const goalRef = doc(db, "users", user.uid, "weightGoal", "current");
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
      setGoal(goalSnap.data());
    } else {
      setGoal(null);
    }

    const logsRef = collection(db, "users", user.uid, "weightLogs");
    const logsSnap = await getDocs(logsRef);
    const logs = logsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setWeightLogs(logs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">⚖️ Контроль веса</h1>

      {/* Цель */}
      <GoalSetup user={user} onUpdate={fetchData} />

      {/* Текущая цель */}
      {goal && <WeightGoalCard goal={goal} />}

      {/* Цели на день */}
      {goal && <WeightDailyTargetCard user={user} goal={goal} logs={weightLogs} />}

      {/* История */}
      <WeightLogCard user={user} logs={weightLogs} onUpdate={fetchData} />}
    </div>
  );
}