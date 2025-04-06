import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
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

export default function ProfileView({ user }) {
  const [userInfo] = useState({
    weight: 76,
    height: 173,
    age: 24,
    activity: "Умеренная активность",
    goal: "Похудеть",
  });

  const [generations, setGenerations] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "generations"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGenerations(data);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-md mx-auto">
      {/* Параметры */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">🎯 Цель и параметры</div>
          <button className="text-gray-400 hover:text-black">
            <Pencil size={18} />
          </button>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed">
          Вес: <b>{userInfo.weight} кг</b><br />
          Рост: <b>{userInfo.height} см</b><br />
          Возраст: <b>{userInfo.age}</b><br />
          Активность: <b>{userInfo.activity}</b><br />
          Цель: <b>{userInfo.goal}</b>
        </div>
      </Card>

      {/* План питания */}
      <Card>
        <div className="font-bold text-lg mb-2">🍽 План питания</div>
        <MealCard
          image="https://source.unsplash.com/100x100/?salad"
          title="Овощной салат с курицей"
          kcal={320}
        />
        <MealCard
          image="https://source.unsplash.com/100x100/?oatmeal"
          title="Овсянка с фруктами"
          kcal={280}
        />
        <MealCard
          image="https://source.unsplash.com/100x100/?steak"
          title="Говядина с рисом"
          kcal={450}
        />
      </Card>

      {/* История генераций */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">🕓 История</div>
          <button className="text-blue-500 text-sm font-medium">Все</button>
        </div>

        {generations.length === 0 ? (
          <p className="text-sm text-gray-500">Пока нет генераций</p>
        ) : (
          <div className="flex flex-col gap-3">
            {generations.map((gen) => (
              <div key={gen.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl shadow">
                {gen.image && (
                  <img
                    src={gen.image}
                    alt="analyzed"
                    className="w-14 h-14 object-cover rounded-md border"
                  />
                )}
                <div>
                  <div className="text-xs text-gray-400 mb-1">
                    {gen.createdAt?.toDate?.().toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{gen.resultText}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}