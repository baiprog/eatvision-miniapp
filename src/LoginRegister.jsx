import { useState } from 'react';
import { auth } from './firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function LoginRegister() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('📩 Письмо отправлено! Проверьте почту.');
    } catch (error) {
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Добро пожаловать в EatVision</h2>
        <p className="text-sm text-gray-300 mb-6 text-center">Введите email, чтобы войти или зарегистрироваться</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {loading ? '⏳ Отправка...' : '🚀 Войти / Зарегистрироваться'}
          </button>
        </form>

        {message && <p className="text-sm text-center mt-4 text-white/80">{message}</p>}
      </div>
    </div>
  );
}
