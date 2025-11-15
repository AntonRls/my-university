/**
 * ПРИМЕР конфигурации локальных моков для разработки.
 * 
 * ⚠️ ЭТОТ ФАЙЛ КОММИТИТСЯ В GIT - НЕ ДОБАВЛЯЙТЕ СЮДА РЕАЛЬНЫЕ ДАННЫЕ!
 * 
 * Для использования:
 * 1. Скопируйте этот файл в `local-auth.mock.ts` (он в .gitignore)
 * 2. Замените данные ниже на свои из MAX Bridge
 * 3. Перезапустите dev-сервер
 * 
 * Откуда взять данные:
 * - Откройте ваше мини-приложение в MAX мессенджере
 * - В DevTools выполните: console.log(window.WebApp.initData)
 * - Скопируйте строку в queryParams ниже
 */

// Вариант 1: Готовая строка query_params из MAX (РЕКОМЕНДУЕТСЯ)
// Этот способ гарантирует правильный хэш
export default {
  enabled: true,
  queryParams:
    'auth_date=1762888234' +
    '&chat=%7B%22id%22%3A32031148%2C%22type%22%3A%22DIALOG%22%7D' +
    '&hash=c050dab2c1ec3ea3004ca592cd67856b70e2c93bc3d10e2f00e8e680a931bf1c' +
    '&query_id=5ccd57ca-73d4-4bdb-a9d6-e627d5d9cd6d' +
    '&user=%7B%22id%22%3A97678977%2C%22first_name%22%3A%22%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9%22%2C%22last_name%22%3A%22%D0%A7%D0%B5%D1%80%D0%BD%D1%8B%D1%88%D1%91%D0%B2%22%2C%22username%22%3Anull%2C%22language_code%22%3A%22ru%22%2C%22photo_url%22%3A%22https%3A%2F%2Fi.oneme.ru%2Fi%3Fr%3DBTGBPUwtwgYUeoFhO7rESmr8cNdBiO7zqxRzxUpqyfoDPyKjjp1xAJ9Yih2uVbWm2ZY%22%7D' +
    '&ip=213.87.160.44',
};

// Вариант 2: Объект payload (может не работать если порядок полей не совпадет)
// export default {
//   enabled: true,
//   payload: {
//     auth_date: 1762888234,
//     query_id: '5ccd57ca-73d4-4bdb-a9d6-e627d5d9cd6d',
//     hash: 'c050dab2c1ec3ea3004ca592cd67856b70e2c93bc3d10e2f00e8e680a931bf1c',
//     user: {
//       id: 97678977,
//       first_name: 'Сергей',
//       last_name: 'Чернышёв',
//       username: null,
//       language_code: 'ru',
//       photo_url: 'https://i.oneme.ru/i?r=BTGBPUwtwgYUeoFhO7rESmr8cNdBiO7zqxRzxUpqyfoDPyKjjp1xAJ9Yih2uVbWm2ZY',
//     },
//     chat: {
//       id: 32031148,
//       type: 'DIALOG',
//     },
//     ip: '213.87.160.44',
//   },
// };

// Вариант 3: Отключить мок (используется реальный MAX Bridge)
// export default {
//   enabled: false,
// };

