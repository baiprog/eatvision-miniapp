import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">{children}</div>
);

const MealCard = ({ image, title, kcal }) => (
  <div className="flex items-center gap-3 border rounded-xl p-2">
    <img src={image} alt={title} className="w-12 h-12 rounded-lg object-cover" />
    <div className="flex-1">
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-gray-500">{kcal} ккал</div>
    </div>
    <button className="text-xs text-blue-500 font-medium">Подробнее</button>
  </div>
);

export default function MealPlanSection({ user }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!user?.uid) return;
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const userInfo = snap.data();

      const prompt = `Составь план питания на день для человека с параметрами: вес ${userInfo.weight} кг, рост ${userInfo.height} см, возраст ${userInfo.age}, активность: ${userInfo.activity}, цель: ${userInfo.goal}. Верни JSON-массив из блюд, каждое содержит: title, kcal.`;

      const res = await fetch("https://gpt4-vision-proxy.onrender.com/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      const json = JSON.parse(content);
      setMeals(json);
    } catch (e) {
      console.error("❌ Ошибка генерации плана питания:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePlan();
  }, [user]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg">🍽 План питания</div>
        <button onClick={generatePlan} className="text-sm text-blue-500">
          🔄 Обновить
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">⏳ Генерируем план питания...</p>
      ) : (
        meals.map((meal, i) => (
          <MealCard
            key={i}
            title={meal.title}
            kcal={meal.kcal}
            image={`https://source.unsplash.com/100x100/?food,${encodeURIComponent(meal.title)}`}
          />
        ))
      )}
    </Card>
  );
}