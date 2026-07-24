/* eslint-disable @next/next/no-html-link-for-pages -- vinext client navigation is more reliable with plain anchors */

import type { Metadata } from "next";
import kitchenCarData from "@/data/kitchen-car-sources.json";

type KitchenCarSource = {
  id: string;
  name: string;
  baseMunicipality: string | null;
  calendarUrl: string;
  calendarTypeLabel: string;
  freshnessStatus:
    | "current"
    | "recent_not_current"
    | "calendar_empty"
    | "no_calendar_found"
    | "inaccessible";
  displayNote: string;
  sameDayNote: string;
};

const currentKitchenCars = (kitchenCarData.vehicles as KitchenCarSource[]).filter(
  (source) => source.freshnessStatus === "current",
);

function displayDate(value: string) {
  return value.replaceAll("-", ".");
}

export const metadata: Metadata = {
  title: "キッチンカーは、今日どこへ。｜みえのものさし",
  description:
    "三重県内のキッチンカーが公開している出店予定を、確認できた範囲で案内する試験ページ。",
};

export default function KitchenCarsPage() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="みえのものさし ホーム">
          <span className="mie-silhouette" aria-hidden="true" />
          <span className="wordmark-copy">
            <span className="wordmark-main">みえのものさし</span>
            <span className="wordmark-sub">EVENT FINDER / BETA</span>
          </span>
        </a>
        <nav className="header-actions" aria-label="ページ">
          <a className="header-nav-link" href="/">
            催し一覧
          </a>
          <a className="header-nav-link is-current" href="/kitchen-cars" aria-current="page">
            キッチンカー
          </a>
        </nav>
      </header>

      <section className="kitchen-car-lab kitchen-car-page" aria-labelledby="kitchen-car-title">
        <div className="kitchen-car-heading">
          <div>
            <p className="eyebrow">KITCHEN CAR / EXPERIMENTAL</p>
            <h1 id="kitchen-car-title">キッチンカーは、今日どこへ。</h1>
          </div>
          <div className="trial-note">
            <strong>試験中</strong>
            <span>使うかどうかは未定</span>
          </div>
        </div>

        <p className="kitchen-car-lead">
          公開情報から当月の予定を確認できた車両だけを仮掲載しています。
          出店場所や時間は変わるため、出発前に公式情報を確認してください。
        </p>

        <div className="kitchen-car-grid">
          {currentKitchenCars.map((source, index) => (
            <article className="kitchen-car-card" key={source.id}>
              <span className="kitchen-car-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="kitchen-car-copy">
                <div className="kitchen-car-meta">
                  <span>{source.baseMunicipality ?? "三重県内"}</span>
                  <span>{source.calendarTypeLabel}</span>
                </div>
                <h2>{source.name}</h2>
                <p>{source.displayNote}</p>
                <small>{source.sameDayNote}</small>
              </div>
              <a href={source.calendarUrl} target="_blank" rel="noreferrer">
                出店予定を見る <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>

        <div className="kitchen-car-footnote">
          <span>{`現在表示 ${currentKitchenCars.length}台 / 調査候補 ${kitchenCarData.vehicles.length}台`}</span>
          <span>確認 {displayDate(kitchenCarData.updatedAt)}</span>
          <p>
            古い予定、空欄のカレンダー、SNSで確認できない車両は表示せず、情報源台帳にだけ残しています。
          </p>
        </div>
      </section>

      <footer className="kitchen-car-page-footer">
        <div>
          <strong>みえのものさし</strong>
          <p>イベント一覧へ戻り、日付や地域から催しを探せます。</p>
        </div>
        <a className="footer-back-link" href="/">
          催し一覧へ戻る
        </a>
      </footer>
    </main>
  );
}
