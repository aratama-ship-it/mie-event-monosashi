# Protected baseline

## 現行基準（2026-10-01 本人承認により更新）

2026-10-01、本人の承認により、現在の `data/events.json` と `tests/rendered-html.test.mjs` を新しい保護基準とした。
更新前の `events.json` は 2026-09-04 のコミット `74b2507`（218件へ更新、終了判定テストをid照合に）と
`9102d63`（終了したイベント146件を `data/archive/` へ退避）で変わったもので、9/5 の観察前確認で不一致が検出されていた。
`events.json` 本体は今回変更していない。

- Git HEAD: `7d7a509fabed68d0d8e501ae9b7bef583db3ac4b`
- `data/events.json`: SHA-256 `e65c985fb4542593e69984fa68b564bfdc6e4557bc00e7aa22b70768ce6018ca`
- `tests/rendered-html.test.mjs`: SHA-256 `adb6515f722738f40aac24744b39ecd7ae898115bcb50033d50642c69a27cffc`
- `data/municipal-sources.json`: SHA-256 `a147f53779e1cb7667a0b2582ccc72902d37096cc2c93f8330e2e7b98597a82e`（変更なし）
- `scripts/validate-events.mjs`: SHA-256 `4cfb6a9348db224e8fc2f0c40223d4dec4706c33846cc20a9059f50759ad1fe4`（変更なし）

基準ハッシュの実体は `validate-registry.mjs` の `protectedFiles` にある。基準を更新するときは、この文書と `validate-registry.mjs` を同時に更新し、
更新前の版を `*.before-<日付>.*` として残す。この run が変更してよいのは、この調査ディレクトリ配下だけである。
更新前の版: `BASELINE.before-2026-10-01.md` / `validate-registry.before-2026-10-01.mjs` / `STATE.before-2026-10-01.md`。

## 旧基準（2026-09-01 時点・参考として保持）

- Git HEAD: `381df77ffcdb4cf7d29188e3cddcf3a8740a327d`
- `data/events.json`: modified before this run; SHA-256 `e798f71dba84b968023d9534f46884fc11176024005ec153d7d0cf1b88191284`
- `tests/rendered-html.test.mjs`: modified before this run; SHA-256 `2011274afa202cc094c1a913f0168b85f3ba2ed90f517de2f428bdcf0f03d121`
- `overnight-runs/2026-08-20-current-event-refresh-until-10/`: untracked before this run
- `data/municipal-sources.json`: clean before this run; SHA-256 `a147f53779e1cb7667a0b2582ccc72902d37096cc2c93f8330e2e7b98597a82e`
- `scripts/validate-events.mjs`: clean before this run; SHA-256 `4cfb6a9348db224e8fc2f0c40223d4dec4706c33846cc20a9059f50759ad1fe4`
