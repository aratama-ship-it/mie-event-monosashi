# みえのものさし

三重県内のイベントを、日付・地域・料金・予約条件・子どもの参加しやすさから探すためのウェブサイトです。

公開サイト: [https://mie-event-monosashi.juggler-arata.chatgpt.site/](https://mie-event-monosashi.juggler-arata.chatgpt.site/)

## このサイトで扱うもの

- 祭り、舞台、音楽、展覧会、学び、交流、スポーツ
- 自治体や観光情報だけでは拾いにくい、小規模な体験や施設内イベント
- 大型商業施設（イオンモール等）の催しのうち、日付が限定され「その日に行く理由」があるもの
- JFL、東海社会人サッカー、高校野球などの試合
- 子ども向け・子ども参加可・条件あり・子ども対象外・公式で要確認の評価
- キッチンカーの公開予定表を使った実験的な探索

イベントの紹介文や画像を転載せず、主催者・自治体・会場などの一次資料で確認できる事実を独自に要約しています。各イベントには一次資料URL、確認日、次回確認日を保持しています。

詳しい収集・公開方針は [SOURCE_POLICY.md](./SOURCE_POLICY.md)、巡回経路は [COLLECTION_ROUTES.md](./COLLECTION_ROUTES.md) を参照してください。

## データ

- `data/events.json`: 公開するイベント
- `data/discovery-sources.json`: 小規模イベントを発見・確認する巡回先
- `data/municipal-sources.json`: 東紀州5市町の公式情報源
- `data/facility-sources.json`: 大型商業施設の公式イベントページと、掲載判断を保留した候補
- `data/festival-watchlist.json`: 当年の一次資料や詳細確認を待つ、未公開の地区祭り候補
- `data/kitchen-car-sources.json`: キッチンカー予定表の調査候補

イベントの日付は `startDate` / `endDate` を正本とし、飛び日は `dates`、休館日は `closedWeekdays`
で表す。カード上の「7–8月」「31–2」のような表示文字列は `lib/event-dates.mjs` が生成するので、
データ側には持たせない。終了したイベントは自動で一覧から外れる。

発見用の情報だけではイベントを公開せず、一次資料で日時と場所を確認する運用です。

## ローカルで動かす

Node.js 22.13.0以上が必要です。

```bash
npm install
npm run dev
```

主な確認コマンド:

```bash
npm run data:check
npm test
npm run lint
```

## 公開（GitHub Pages）

`main` へ push すると `.github/workflows/deploy-pages.yml` が動き、
https://aratama-ship-it.github.io/mie-event-monosashi/ へ公開されます。
lint・テスト・データ検証を通ってからデプロイされます。

**初回だけ手動設定が必要です**: GitHubのSettings → Pages → Build and deployment → Source を
「GitHub Actions」に変更してください。これをしないとワークフローが失敗します。

手元で公開版を確認する:

```bash
npm run preview:pages
```

`http://localhost:4181/mie-event-monosashi/` で開きます。GitHub Pagesと同じ**サブパス配信**を
再現しているので、`dist/client` を直接ルートで開くより実態に近い確認ができます。

### 静的エクスポートの注意点

- **`basePath` を設定してはいけません。** vinext 0.0.50 はprerender時に一時サーバーの `/` を
  取得する実装で、Nextの `basePath` かViteの `base` を設定すると404になり、
  実ページ2本がエクスポートから落ちて404.htmlだけが出力されます。
  サブパスは `app/site-path.ts`（自前のリンク）と `scripts/apply-base-path.mjs`（アセットURL）で当てています。
- ページには `export const dynamic = "force-static"` が必要です。無いとvinextがルートを
  未分類と判定し、prerenderをスキップします。ルートセグメント設定は `"use client"` のファイルに
  置けないため、`app/page.tsx` は薄いサーバーコンポーネントで、UI本体は `app/event-finder.tsx` にあります。
- `headers()` を使うとルートが動的判定になり同じくスキップされます。サイトURLは
  `SITE_URL`（ビルド時）で固定しています。
- `.nojekyll` が必要です。GitHub PagesのJekyllはアンダースコア始まりのディレクトリを削除するため、
  無いと `assets/_vinext_fonts` が消えてフォントが失われます。

環境変数（既定値あり、通常は変更不要）:

| 変数 | 既定値 | 用途 |
|---|---|---|
| `SITE_BASE_PATH` | `/mie-event-monosashi` | サブパス。独自ドメインでルート配信するなら空文字 |
| `SITE_URL` | `https://aratama-ship-it.github.io/mie-event-monosashi` | `metadataBase`・OG画像の絶対URL |

## 技術構成

- Next.js / React
- vinext
- 公開ビルド: 静的エクスポート（`npm run build:pages`）→ GitHub Pages
- 既定ビルド（`npm run build`）: Cloudflare Workers互換のSSR。ChatGPT Sites用に残しています

## ライセンス

現時点では、このリポジトリにオープンソースライセンスを設定していません。掲載元の文章・画像・チラシ等の権利は各権利者に帰属します。
