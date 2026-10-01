# Day 0 — 2026-09-01

## Outcome

- Full observation: 1 / 7
- Sources requested: 86
- Successful retrievals: 86
- Errors: 0
- Redirects: 0
- Stored content: none
- Stored metadata: HTTP status, content type, SHA-256 content hash, byte count, duration

## Baseline note

接続権限を確認するため、最初に3入口の限定テストを行った。そのため本番スナップショットでは
83件が `first-seen`、同じ内容だったテスト済み3件が `unchanged` になっている。
全86入口の比較基準は、本番スナップショット
`observations/observation-2026-09-01T07-12-40Z.json` とする。

## Boundary

- `partial` 9入口は自動巡回に含めていない。
- `blocked` 2入口は自動巡回に含めていない。
- イベント本文、画像、PDF本文は保存していない。
- 正本、公開データ、Git、デプロイは変更していない。
