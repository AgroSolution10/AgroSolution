# AgroSolution

Monorepo do AgroSolution — consultor financeiro de bolso para o produtor rural.

## Estrutura

```
AgroSolution/
├── apps/
│   ├── mobile/   # App React Native + Expo (TypeScript)
│   └── api/      # API Node.js (em construção)
└── docs/         # Modelagem, SQL, apresentação
```

## Como rodar o app mobile

```powershell
cd apps/mobile
npm install
Copy-Item .env.example .env
npx expo install --check   # alinha versões nativas
npx expo start
```

Depois pressione **`i`** (iOS, Mac), **`a`** (Android emulador) ou escaneie o QR code com o app **Expo Go** no celular.

## Tarefas atuais (sprint 1)

- [x] Estrutura do projeto
- [ ] Tela de **Cadastro** — Alana _(em andamento)_
- [ ] Tela de **Login** — TBD
- [ ] Tela de **OTP / verificação de e-mail** — TBD
- [ ] API `POST /auth/cadastro`, `POST /auth/login`, `POST /auth/otp/verificar` — TBD
