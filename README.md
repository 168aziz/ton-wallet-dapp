# TON Wallet — Self-Custodial Testnet Wallet

Минималистичный web-кошелёк для TON testnet. Все ключи хранятся локально в браузере, зашифрованные паролем пользователя.

## Запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`

Для production-сборки:

```bash
npm run build
npm run preview
```

## Тестирование

1. Создай кошелёк (Create New Wallet) или импортируй существующий
2. Получи тестовые TON через [@testgiver_ton_bot](https://t.me/testgiver_ton_bot) (2 TON / 12 часов)
3. Проверь баланс и транзакции на [testnet.tonviewer.com](https://testnet.tonviewer.com)

## Архитектура

```
Browser (SPA, no backend)
  │
  ├── React 19 + TypeScript + Vite
  ├── Zustand (state management)
  ├── Tailwind CSS 4 (styling)
  │
  ├── services/ton/     — @ton/ton SDK: wallet creation, transfers, balance, tx history
  ├── services/crypto/  — Web Crypto API: AES-256-GCM encryption of mnemonic
  ├── stores/           — Zustand: wallet state, balance, transactions, address book
  ├── hooks/            — useBalance (polling 15s), useTransactions
  ├── utils/            — Address validation, poisoning detection, clipboard
  └── pages/            — 7 screens: Welcome, Create, Import, Unlock, Dashboard, Receive, Send
        │
        └── TON Testnet (via Orbs Network → TON Center API v2)
```

### Стек

| Слой | Технология | Почему |
|---|---|---|
| Framework | React 19 + Vite | Быстрый dev, лучшая интеграция с TON SDK |
| TON SDK | @ton/ton + @ton/crypto + @ton/core | Официальный SDK, TypeScript-native |
| API | TON Center v2 через @orbs-network/ton-access | Бесплатный, без API ключей, без backend |
| Wallet | WalletContractV4R2 | Стандартный, простой, достаточен для testnet |
| State | Zustand | Минимальный boilerplate, persist-friendly |
| Styling | Tailwind CSS 4 | Utility-first, быстрая итерация |
| Encryption | Web Crypto API (AES-256-GCM + PBKDF2) | Встроенный в браузер, без доп. зависимостей |

### Хранение данных

| Данные | Где | Шифрование |
|---|---|---|
| Мнемоника | localStorage | AES-256-GCM, ключ из PBKDF2(password, salt, 100k iterations) |
| Приватный ключ | только RAM (Zustand store) | Не персистится, очищается при lock/закрытии вкладки |
| Адрес кошелька | localStorage (plaintext) | Публичная информация |
| Кэш баланса | localStorage | Plaintext, fallback при 502 ошибках API |
| Address book | localStorage | Plaintext, адреса публичны |

### Создание кошелька

Полностью локальное, без запросов к сети:

1. `mnemonicNew(12)` — генерация 12 слов через `crypto.getRandomValues()` (CSPRNG)
2. `mnemonicToPrivateKey()` — PBKDF2-HMAC-SHA512 → Ed25519 keypair
3. `WalletContractV4.create({ publicKey })` — детерминистичное вычисление адреса: `hash(contract_code + initial_data)`
4. Шифрование мнемоники паролем пользователя → сохранение в localStorage

Контракт кошелька НЕ деплоится при создании. Аккаунт появляется на блокчейне при первом получении TON (`uninit`), а контракт разворачивается при первой исходящей транзакции (SDK автоматически прикрепляет `stateInit`).

## Защита от адрес-подмены (Address Poisoning Protection)

### Проблема

Address poisoning — атака, при которой злоумышленник:
1. Анализирует историю транзакций жертвы
2. Генерирует адрес с совпадающими первыми и последними символами
3. Отправляет dust-транзакцию с этого адреса
4. Жертва копирует адрес из истории, не проверяя середину → отправляет средства атакующему

### Реализованные проверки

| Проверка | Trigger | Severity | Blocking |
|---|---|---|---|
| Address poisoning | Prefix (4 chars) + suffix (4 chars) совпадают с адресом из истории, середина отличается | DANGER | Да — требует checkbox |
| Partial similarity | Только prefix или suffix совпадает с адресом из истории | WARNING | Нет |
| Новый адрес | Адрес не встречался в истории транзакций | INFO | Нет |
| Отправка себе | Recipient === собственный адрес | WARNING | Нет |
| Mainnet адрес | Адрес начинается на E/U вместо 0/k (testnet) | WARNING | Нет |
| Bounceable адрес | Адрес bounceable — средства вернутся если recipient не инициализирован | WARNING | Нет |
| Крупная сумма | Amount > 50 TON | DANGER | Да — требует checkbox |

### UX решения для предупреждений

- Цветовая кодировка: синий (info) → жёлтый (warning) → красный (danger)
- Blocking warnings требуют checkbox "I have verified the recipient address and amount are correct"
- Кнопка Cancel отображается выше Send (default action = отмена)
- Кнопка Send содержит конкретную сумму ("Send 5 TON", а не "Confirm")
- Предупреждения показываются и на форме ввода, и на экране подтверждения

## Компромиссы и решения

| Решение | Альтернатива | Почему выбрано |
|---|---|---|
| V4R2 вместо V5R1 | V5R1 с replay protection между сетями | V4R2 проще, для testnet replay protection не нужна |
| Polling баланса (15s) | WebSocket подписка | WebSocket добавляет сложность, polling достаточен |
| Client-side поиск транзакций | Server-side search | Нет backend, до ~1000 транзакций работает нормально |
| @orbs-network/ton-access | Прямой TON Center API с API key | Бесплатный, без регистрации, автоматический выбор endpoint |
| Кэш баланса при 502 | Показывать ошибку | Лучший UX — показать последний известный баланс |
| Pending state при timeout | Показывать ошибку | Транзакция отправлена в сеть, ошибка вводит в заблуждение |

## Дальнейшие улучшения

- **Address book UI** — сохранение и выбор проверенных адресов
- **Jetton (token) support** — отображение и отправка токенов
- **NFT gallery** — просмотр NFT на кошельке
- **Multi-wallet** — несколько кошельков в одном приложении
- **WalletConnect** — подключение к dApps
- **Push notifications** — уведомления о входящих транзакциях через Service Worker
- **Export/backup** — экспорт мнемоники с повторной аутентификацией
- **Rate limiting / circuit breaker** — graceful degradation при перегрузке API
- **E2E тесты** — Playwright для полных user flows
