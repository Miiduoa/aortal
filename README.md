# Aortal

API 回傳格式變了，不該等到前端壞掉才知道。

Aortal 是一個小型 JSON contract guard。它從實際 payload 建立 schema snapshot，再在 CI 比對新的 payload；required field 消失或型別被改掉時，直接用非零 exit code 擋下來。

## Why

第三方 API、內部 service、甚至自己寫的後端，都可能在「看似小改」時破壞既有 consumer。Aortal 專注在一件事：讓這類破壞可以被 code review 與 CI 看見。

## Quick start

```bash
npm install

node src/cli.mjs snapshot fixtures/users-v1.json --out fixtures/users.contract.json
node src/cli.mjs check fixtures/users-v2.json --contract fixtures/users.contract.json
```

範例輸出：

```text
BREAKING
- $.email: required field missing
- $.id: type changed ("integer" -> "string")

WARNING
- $.locale: new field
```

偵測到 breaking change 時 exit code 是 `2`。

## Rules

- required field 消失：breaking
- 欄位型別改變：breaking
- integer → number：相容
- 新增欄位：warning
- 原本不可為 null、後來變 nullable：warning
- nested object / array 會遞迴比較

## Design choices

這不是 OpenAPI validator，也不嘗試取代正式 schema registry。

Aortal 適合「手上已經有真實 JSON 樣本，但還沒有完整 API contract」的小型專案。schema 是從 sample 推導出來的普通 JSON，容易 review，也不需要 runtime dependency。

## Test

```bash
npm test
```

使用 Node.js built-in test runner。CI 跑 Node 24 LTS。

## License

MIT
