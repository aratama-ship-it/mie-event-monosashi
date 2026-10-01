# 1週間の市町別差分観察

## 観察単位

1回の確認を「1市町 × 1公式入口 × 1確認日時」とする。

## 記録項目

```json
{
  "municipality": "津市",
  "sourceId": "tsu-municipal-calendar",
  "checkedAt": "2026-09-01T09:00:00+09:00",
  "outcome": "changed",
  "candidateCount": 0,
  "changes": [],
  "retrievalStatus": "available",
  "note": "イベントが見つからない場合も、確認した入口と状態を記録する"
}
```

## `outcome`

- `changed`: 前回から表示内容が変わった。
- `unchanged`: 前回と同じ。
- `empty`: 開けたが対象候補を確認できなかった。
- `blocked`: 現在の方法では内容を確認できなかった。
- `error`: URL切れ、サーバーエラーなど。
- `first-seen`: 初回確認で比較対象がない。

## イベント候補の状態

- `new_candidate`
- `updated_candidate`
- `deadline_changed`
- `cancelled_or_postponed`
- `possible_duplicate`
- `primary_source_missing`
- `participation_conditions_missing`
- `out_of_scope`

候補状態は `data/events.json` への掲載権限ではない。日時、場所、HTTPSの一次資料、料金・対象・
申込条件の確認後も、人による採用を待つ。

## 1週間後に集計する値

- 市町別の確認入口数
- 正常に確認できた入口率
- 新規・更新・締切・中止候補数
- 空振り数
- 取得不能数
- 市町間・横断サイトとの重複候補数
- 1件を一次資料まで確認するのに必要だった人手
