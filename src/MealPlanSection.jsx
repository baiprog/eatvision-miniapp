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

  useEffect(() => {
    const generatePlan = async () => {
      if (!user?.uid) return;
      setLoading(true);
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const userInfo = snap.data();

      const prompt = `Составь план питания на день для человека с параметрами: вес ${userInfo.weight} кг, рост ${userInfo.height} см, возраст ${userInfo.age}, активность: ${userInfo.activity}, цель: ${userInfo.goal}. Верни в формате JSON массив с блюдами, каждое содержит: title, kcal.`;

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer YOUR_OPENAI_KEY`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        });

        const data = await res.json();
        const content = data.choices[0].message.content;
        const json = JSON.parse(content);
        setMeals(json);
      } catch (e) {
        console.error("Ошибка генерации плана питания:", e);
      } finally {
        setLoading(false);
      }
    };

    generatePlan();
  }, [user]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg">🍽 План питания</div>
        <button
          className="text-sm text-blue-500"
          onClick={() => window.location.reload()}
        >
          Обновить
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">⏳ Генерируем план питания...</p>
      ) : (
        meals.map((meal, i) => (
          <MealCard key={i} title={meal.title} kcal={meal.kcal} image={`https://source.unsplash.com/100x100/?food,${i}`} />
        ))
      )}
    </Card>
  );
}