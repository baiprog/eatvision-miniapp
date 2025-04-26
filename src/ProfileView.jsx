import { useState, useEffect, Fragment } from "react";
import { Pencil } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { Dialog, Transition } from "@headlessui/react";
import { db } from "./firebase";
import EditProfileModal from "./EditProfileModal";
import MealPlanSection from "./MealPlanSection";

// Уровни активности
const ACTIVITY_LEVELS = [
  { value: 1.2, label: "0-1 тренировка/неделя (минимальная)" },
  { value: 1.375, label: "2-3 тренировки/неделя (лёгкая)" },
  { value: 1.55, label: "4-5 тренировок/неделя (средняя)" },
  { value: 1.725, label: "6-7 тренировок/неделя (высокая)" },
];
// Дефицит — ккал и описание
const DEFICIT_LEVELS = [
  { value: 300, label: "Медленно (-300 ккал/день)" },
  { value: 500, label: "Оптимально (-500 ккал/день)" },
  { value: 700, label: "Быстро (-700 ккал/день)" },
];

// Формула Харриса-Бенедикта
function calcBMR({ sex, weight, height, age }) {
  if (sex === "male") {
    return 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age;
  }
  return 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;
}
function calcTDEE(bmr, activity) {
  return bmr * activity;
}
function calcMacros(weight, calories) {
  const protein = Math.round(weight * 1.8);
  const fats = Math.round(weight * 1.0);
  const kcalFromProtein = protein * 4;
  const kcalFromFats = fats * 9;
  const carbs = Math.round((calories - kcalFromProtein - kcalFromFats) / 4);
  return { protein, fats, carbs };
}

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">{children}</div>
);

export default function ProfileView({ user }) {
  const [userInfo, setUserInfo] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedGen, setSelectedGen] = useState(null);

  // По умолчанию
  const defaultProfile = {
    sex: "male",
    weight: 70,
    height: 170,
    age: 25,
    activity: 1.375,
    deficit: 500,
    goal: "Похудение",
  };

  // Загрузка профиля и генераций
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserInfo = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserInfo({ ...defaultProfile, ...docSnap.data() });
      } else {
        setUserInfo(defaultProfile);
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
    // eslint-disable-next-line
  }, [user]);

  // При любом изменении профиля — автосохраняем нормы и макросы
  useEffect(() => {
    if (!userInfo || !user?.uid) return;
    // Переводим значения в цифры (на всякий случай)
    const activityValue = Number(userInfo.activity) || 1.375;
    const deficitValue = Number(userInfo.deficit) || 500;
    const weight = Number(userInfo.weight) || 70;
    const height = Number(userInfo.height) || 170;
    const age = Number(userInfo.age) || 25;
    const sex = userInfo.sex || "male";

    // Расчёт норм
    const bmr = calcBMR({ sex, weight, height, age });
    const tdee = calcTDEE(bmr, activityValue);
    const calories = Math.max(1000, Math.round(tdee - deficitValue));
    const macros = calcMacros(weight, calories);

    // Сохраняем профиль и нормы в Firestore (merge)
    setDoc(doc(db, "users", user.uid), {
      ...userInfo,
      calories,
      macros
    }, { merge: true });
  }, [userInfo, user]);

  // Обновление и сохранение профиля
  const saveProfile = async (patch) => {
    const updated = { ...userInfo, ...patch };
    setUserInfo(updated);
    // не дожидаемся сохранения — эффект useEffect обновит поля
  };

  if (!userInfo) return null;

  // Переводим значения в цифры (на всякий случай)
  const activityValue = Number(userInfo.activity) || 1.375;
  const deficitValue = Number(userInfo.deficit) || 500;
  const weight = Number(userInfo.weight) || 70;
  const height = Number(userInfo.height) || 170;
  const age = Number(userInfo.age) || 25;
  const sex = userInfo.sex || "male";

  // Расчёт норм (они совпадут с теми, что сохранены)
  const bmr = calcBMR({ sex, weight, height, age });
  const tdee = calcTDEE(bmr, activityValue);
  const calories = Math.max(1000, Math.round(tdee - deficitValue));
  const macros = calcMacros(weight, calories);

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
          Пол: <b>{sex === "male" ? "Мужской" : "Женский"}</b>
          <br />
          Вес: <b>{weight} кг</b>
          <br />
          Рост: <b>{height} см</b>
          <br />
          Возраст: <b>{age}</b>
          <br />
          Активность: <b>
            {ACTIVITY_LEVELS.find(a => a.value === activityValue)?.label || "?"}
          </b>
          <br />
          Темп похудения: <b>
            {DEFICIT_LEVELS.find(d => d.value === deficitValue)?.label || "?"}
          </b>
          <br />
          Цель: <b>{userInfo.goal}</b>
        </div>
        {/* Рекомендации по питанию */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧑‍⚕️</span>
            <span className="font-semibold text-gray-700">Рекомендации на сегодня</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-base">
            <div className="text-gray-500">Калории:</div>
            <div className="font-semibold text-orange-600">{calories} ккал</div>
            <div className="text-gray-500">Белки:</div>
            <div className="font-semibold text-gray-800 flex items-center gap-1">{macros.protein} г <span className="text-lg">🥩</span></div>
            <div className="text-gray-500">Жиры:</div>
            <div className="font-semibold text-gray-800 flex items-center gap-1">{macros.fats} г <span className="text-lg">🧈</span></div>
            <div className="text-gray-500">Углеводы:</div>
            <div className="font-semibold text-gray-800 flex items-center gap-1">{macros.carbs} г <span className="text-lg">🍚</span></div>
          </div>
        </div>
      </Card>

      <MealPlanSection user={user} userInfo={{...userInfo, calories, macros}} />

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

      {/* Модалка редактирования профиля */}
      <Transition appear show={editOpen} as={Fragment}>
        <Dialog onClose={() => setEditOpen(false)} className="relative z-50">
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
                <Dialog.Title className="text-lg font-bold mb-2">Редактировать профиль</Dialog.Title>
                {/* Форма редактирования */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setEditOpen(false);
                  }}
                  className="space-y-3"
                >
                  <label className="block">Пол:
                    <select
                      className="ml-2"
                      value={sex}
                      onChange={e => saveProfile({ sex: e.target.value })}
                    >
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </label>
                  <label className="block">Вес (кг):
                    <input
                      type="number"
                      min="30"
                      max="300"
                      className="ml-2 w-20"
                      value={weight}
                      onChange={e => saveProfile({ weight: Number(e.target.value) })}
                    />
                  </label>
                  <label className="block">Рост (см):
                    <input
                      type="number"
                      min="100"
                      max="250"
                      className="ml-2 w-20"
                      value={height}
                      onChange={e => saveProfile({ height: Number(e.target.value) })}
                    />
                  </label>
                  <label className="block">Возраст:
                    <input
                      type="number"
                      min="10"
                      max="120"
                      className="ml-2 w-20"
                      value={age}
                      onChange={e => saveProfile({ age: Number(e.target.value) })}
                    />
                  </label>
                  <label className="block">Активность:
                    <select
                      className="ml-2"
                      value={activityValue}
                      onChange={e => saveProfile({ activity: Number(e.target.value) })}
                    >
                      {ACTIVITY_LEVELS.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">Темп похудения:
                    <select
                      className="ml-2"
                      value={deficitValue}
                      onChange={e => saveProfile({ deficit: Number(e.target.value) })}
                    >
                      {DEFICIT_LEVELS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">Цель:
                    <input
                      type="text"
                      className="ml-2 w-48"
                      value={userInfo.goal || ""}
                      onChange={e => saveProfile({ goal: e.target.value })}
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white rounded-xl text-sm"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Модалка с подробным результатом анализа */}
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