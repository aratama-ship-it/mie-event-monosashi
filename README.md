# みえのものさし

三重県内のイベントを、日付・地域・料金・予約条件・子どもの参加しやすさから探すためのウェブサイトです。

公開サイト: [https://mie-event-monosashi.juggler-arata.chatgpt.site/](https://mie-event-monosashi.juggler-arata.chatgpt.site/)

## このサイトで扱うもの

- 祭り、舞台、音楽、展覧会、学び、交流、スポーツ
- 自治体や観光情報だけでは拾いにくい、小規模な体験や施設内イベント
- JFL、東海社会人サッカー、高校野球などの試合
- 子ども向け・子ども参加可・条件あり・子ども対象外・公式で要確認の評価
- キッチンカーの公開予定表を使った実験的な探索

イベントの紹介文や画像を転載せず、主催者・自治体・会場などの一次資料で確認できる事実を独自に要約しています。各イベントには一次資料URL、確認日、次回確認日を保持しています。

詳しい収集・公開方針は [SOURCE_POLICY.md](./SOURCE_POLICY.md)、巡回経路は [COLLECTION_ROUTES.md](./COLLECTION_ROUTES.md) を参照してください。

## データ

- `data/events.json`: 公開するイベント
- `data/discovery-sources.json`: 小規模イベントを発見・確認する巡回先
- `data/municipal-sources.json`: 東紀州5市町の公式情報源
- `data/kitchen-car-sources.json`: キッチンカー予定表の調査候補

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

## 技術構成

- Next.js / React
- vinext / Cloudflare Workers互換ビルド
- ChatGPT Sitesで公開

## ライセンス

現時点では、このリポジトリにオープンソースライセンスを設定していません。掲載元の文章・画像・チラシ等の権利は各権利者に帰属します。
