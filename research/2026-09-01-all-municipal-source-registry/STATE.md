# Current state

- Status: OBSERVATION_WEEK_BASELINE_UPDATED_NOT_RESUMED
- Last updated: 2026-10-01
- Scope: 三重県29市町の公式情報源入口
- Municipalities: 29 / 29
- Candidate sources: 97 unique URLs
- Retrieval: 86 available / 9 partial / 2 blocked
- Completed full observations: 3 / 7
- Daily continuation: automation 29 paused; 4 full observations remain
- Canonical files changed by this observation: no
- Push, deploy, publication: not performed

## Completed

- 三重県公式29市町一覧を基準に地域分担を作成
- 公式・一次情報の入口を各市町2〜5件確認
- 候補台帳、観察スキーマ、品質報告、検証スクリプトを作成
- 候補台帳の市町・ID・URL・状態・HTTPSを検証
- 保護対象4ファイルのSHA-256が開始時と同じことを確認
- 既存 `npm run data:check` と `git diff --check` を確認
- 86入口の初回基準取得を完了（error 0 / redirect 0）
- 2026-09-03の第2回観察を完了（unchanged 50 / changed 35 / redirect 1 / error 0）
- 差分・転送36入口を再取得し、全件の最終HTTP 200応答を確認
- 名張市 `nabari-ads-hall` の `www` から同一ドメインapexへの308転送を確認
- 2026-09-04の第3回観察を完了（unchanged 71 / changed 14 / redirect 1 / error 0）
- 差分・転送15入口を再取得し、全件の最終HTTP 200応答を確認
- 残り4回の毎日観察を07:00 JSTに設定
- 2026-09-05の事前確認で保護基準の不一致を検出し、観察を実行せず停止
- 自動実行が空振りにならないようautomation 29を一時停止
- 2026-10-01 本人承認により、現在の `data/events.json` と `tests/rendered-html.test.mjs` を新しい保護基準へ更新（BASELINE.md／validate-registry.mjs。更新前の版は `*.before-2026-10-01.*`）

## Holds

- 多気町観光協会の旧ドメインは無関係な外部サイトへ転送されるため取得停止
- 大台町公式トップは調査時タイムアウト
- 部分取得9入口は安定した取得方法を未確定
- （解消済み 2026-10-01）保護基準の不一致は新基準への更新で解消。基準の Git HEAD は `7d7a509fabed68d0d8e501ae9b7bef583db3ac4b`
- 観察の再開（automation 29 の再設定）は未実施。残り4回の観察は未着手のまま
- `data/municipal-sources.json` への移行は未承認
- `data/events.json` への候補追加は未承認

## Next decision

新しい保護基準は採用済み（2026-10-01）。次は automation 29 を再設定して残り4回を再開する（再設定は本人側の操作で未実施）。
再設定後は、7回の観察完了後に変更候補、取得不能、重複リスク、手動確認量を集計する。
