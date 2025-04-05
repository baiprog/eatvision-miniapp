import { useState } from 'react';

const Card = ({ children }) => (
  <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 my-2 overflow-y-auto max-h-60">
    {children}
  </div>
);

const CardContent = ({ children }) => <div>{children}</div>;

export default function ProfileView() {
  const [user] = useState({ name: 'Имя пользователя', age: 25 }); // placeholder

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-center">👤 Профиль</h2>
      <Card>
        <CardContent>
          <h3 className="font-semibold">📋 План питания</h3>
          <p className="text-sm text-gray-600">
            Здесь будет отображаться персональный рацион питания и список покупок с актуальными ценами.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h3 className="font-semibold">🛒 База продуктов</h3>
          <p className="text-sm text-gray-600">
            Информация о продуктах с возможностью перехода в магазины (Пятёрочка, Перекрёсток и др.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}