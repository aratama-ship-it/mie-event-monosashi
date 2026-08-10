# Overnight Run Plan

## Objective

2026年7月31日10:00 JSTまで、三重県内の2026年8月を中心に9月・10月の催しを一次資料から継続調査し、既存151件との重複を除いた候補を「掲載可能」「要確認」「対象外」に分けた朝の判断材料を残す。

## Scope

- Working directory: `/Users/arata/Library/Mobile Documents/com~apple~CloudDocs/claude code files/app-dev/mie-event-monosashi/mock`
- Writable paths: `overnight-runs/2026-07-31-aug-oct-event-scout/` のみ
- Baseline: `main` / `612d2355296e3442fe12636e3a70b102039f88c3`、開始時の作業ツリーはクリーン
- Time window: 2026年8月1日から10月31日
- Priority: 9月・10月の薄い月、東紀州・伊賀を含む5地域、小規模催事、祭り、音楽、展覧会、スポーツ

## Definition of Done

- 公式・主催者・自治体・会場の情報源を30件以上確認するか、予定した巡回経路をすべて確認する。
- 北勢・中勢・伊勢志摩・東紀州・伊賀の5地域を少なくとも1経路ずつ確認する。
- 既存イベントとの重複を判定し、候補ごとに一次資料URL、確認日時、判定、未確認事項を記録する。
- `candidates.json` がJSONとして読み込め、掲載可能候補に日付・場所・一次資料が揃っている。
- 10:00までに `STATE.md` と `REPORT.md` を最終化し、ledger validatorを通す。

## Allowed Actions

- プロジェクトファイルと既存収集方針を読み取る。
- Web検索を入口に使い、公式・自治体・主催者・会場の一次資料を確認する。
- このrunディレクトリ内の計画、状態、候補データ、確認記録、朝レポートを編集する。
- 読み取り専用で既存151件とのタイトル・日付・会場の重複を照合する。
- JSON構文、URL形式、必須項目、重複を検証するローカルコマンドを実行する。

## Prohibited Actions

- GitHubへのpush、ChatGPT SitesやGitHub Pagesへのデプロイ・公開をしない。
- `data/events.json`、既存の収集台帳、アプリコードを変更しない。
- ユーザーデータを削除しない。
- 画像、チラシ、紹介文、SNS本文を転載しない。
- 一次資料で確認できない日時・場所・料金・対象を推測で埋めない。
- 方向性を変える掲載基準や新カテゴリを無人で決めない。

## Stop Conditions

- 2026年7月31日10:00 JSTになったら新規探索を止め、最終検証と報告を行う。
- 方向性を変える判断は `REPORT.md` の Morning Decisions に残す。
- baselineの正本ファイルまたはGit HEADが予期せず変わった場合、書き込みを止め、差分を記録する。
- 一つの情報源がブロックされても、他の独立した公式経路を継続する。

## Team

- Coordinator: 単独のCodex。範囲、波、停止判断、最終報告を担当。
- Explorer: 同じCodexが読み取り専用で候補と一次資料を確認。
- Writer: 同じCodexだけがrunディレクトリを更新。
- Verifier: 各波の最後に別工程としてJSON・URL・重複・Git差分を再確認。
- Subagents: 本人の事前承認がないため使用しない。

## Verification

- `python3 /Users/arata/.codex/skills/overnight-project-runner/scripts/validate_run.py overnight-runs/2026-07-31-aug-oct-event-scout`
- `node -e "JSON.parse(require('fs').readFileSync('overnight-runs/2026-07-31-aug-oct-event-scout/candidates.json','utf8'))"`
- 候補のURLがHTTPSであること、掲載可能候補に日付・場所・一次資料があることを機械確認する。
- `git status --short --branch` と開始時ハッシュを比較し、正本が変更されていないことを確認する。

## Completion

- Completed: 2026-07-31 10:00 JST
- Result: 候補672件を掲載可能405・要確認221・重複46へ分離し、対象外35件を記録した。
- Boundary: runディレクトリ以外は変更せず、GitHub・公開サイトへの反映は行わなかった。
