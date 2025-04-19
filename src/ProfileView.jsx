import { useState, useEffect, Fragment } from "react";
import { Pencil } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";
import { db } from "./firebase";
import EditProfileModal from "./EditProfileModal";
import MealPlanSection from "./MealPlanSection";

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">{children}</div>
);

export default function ProfileView({ user }) {
  const [userInfo, setUserInfo] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedGen, setSelectedGen] = useState(null);

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
          goal: "Поддерживать форму",
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

      <MealPlanSection user={user} userInfo={userInfo} />

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
                <div className="line-clamp-3 whitespace-pre-wrap mt-1">{gen.resultText}</div>
                <button
                  onClick={() => setSelectedGen(gen)}
                  className="mt-2 text-xs text-blue-500"
                >
                  Подробнее
                </button>
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

      <Transition appear show={!!selectedGen} as={Fragment}>
        <Dialog onClose={() => setSelectedGen(null)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl">
                <Dialog.Title className="text-lg font-bold mb-2">Результат анализа</Dialog.Title>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 mb-4">
                  {selectedGen?.resultText}
                </pre>
                <button
                  onClick={() => setSelectedGen(null)}
                  className="mt-2 px-4 py-2 bg-black text-white rounded-xl text-sm"
                >
                  Закрыть
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}