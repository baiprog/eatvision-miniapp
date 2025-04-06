import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import EditProfileModal from "./EditProfileModal";
import MealPlanSection from "./MealPlanSection";

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
  const [userInfo, setUserInfo] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const loadUserInfo = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserInfo(docSnap.data());
      } else {
        setUserInfo({
          weight: 70,
          height: 170,
          age: 25,
          activity: "Умеренная активность",
          goal: "Поддерживать форму"
        });
      }
    };

    loadUserInfo();

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

  if (!userInfo) return null;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">🎯 Цель и параметры</div>
          <button onClick={() => setEditOpen(true)} className="text-gray-400 hover:text-black">
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

      <MealPlanSection user={user} />

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
              <div
                key={gen.id}
                className="bg-gray-50 p-3 rounded-xl shadow border text-sm text-gray-800"
              >
                {gen.image && (
                  <img
                    src={gen.image}
                    alt="Анализ"
                    className="w-full max-h-48 object-contain mb-2 rounded-lg"
                  />
                )}
                <div className="text-xs text-gray-400">
                  {gen.createdAt?.toDate?.().toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap mt-1">{gen.resultText}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <EditProfileModal
        user={user}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userInfo={userInfo}
        onUpdate={setUserInfo}
      />
    </div>
  );
}