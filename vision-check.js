const axios = require('axios');
const fs = require('fs');

(async () => {
  const imagePath = './test.jpg'; // путь к твоему тестовому изображению
  const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });

  try {
    const response = await axios.post(
      'https://gpt4-vision-proxy.onrender.com/analyze',
      {
        image: `data:image/jpeg;base64,${base64Image}`
      }
    );

    console.log('\n✅ Ответ от GPT-4 Vision через Render backend:\n');
    console.log(
  '\n✅ Ответ GPT:',
  response.data.choices?.[0]?.message?.content || 'Нет текста'
);

  } catch (error) {
    console.error('\n❌ Ошибка:\n', error.response?.data || error.message);
  }
})();