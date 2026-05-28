/**
 * =====================================================
 *  つなぎノート - 交換日記アプリ
 * =====================================================
 */

// ===================================================
//  定数・設定
// ===================================================

// localStorageのキーのプレフィックス
const STORAGE_PREFIX = "diary_";

// 曜日ラベル
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// ===================================================
//  状態変数（アプリの現在の状態を保持）
// ===================================================

// 現在表示している年・月
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0〜11

// 今日の日付（比較用）
const today = new Date();
const todayStr = formatDateKey(today);

// 現在モーダルで開いている日付
let selectedDateStr = null;

// ===================================================
//  ユーティリティ関数
// ===================================================

/**
 * Date オブジェクト → "YYYY-MM-DD" 形式の文字列に変換
 * （localStorageのキーとして使用）
 */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" → 表示用の文字列に変換
 * 例: "2026-05-24" → "5月24日（日）"
 */
function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return { year: `${y}年`, main: `${m}月${d}日`, weekday: `（${weekday}）` };
}

// ===================================================
//  localStorage 操作
// ===================================================

/**
 * ① 日記データを保存する（setItem）
 * キー: "diary_YYYY-MM-DD"
 * 値 : JSON文字列（オブジェクトを JSON.stringify で変換して保存）
 */
function saveDiaryData(dateStr, data) {
  const key   = STORAGE_PREFIX + dateStr;
  const value = JSON.stringify(data); // オブジェクト → 文字列
  localStorage.setItem(key, value);   // ★授業のポイント①
}

/**
 * ② 日記データを取得する（getItem）
 * JSON.parse で文字列 → オブジェクトに戻す
 */
function getDiaryData(dateStr) {
  const key   = STORAGE_PREFIX + dateStr;
  const value = localStorage.getItem(key); //
  if (!value) return null;
  return JSON.parse(value); // 文字列 → オブジェクトに変換
}

/**
 * ③ 1件の日記データを削除する（removeItem） ←課題の機能！
 */
function deleteDiaryData(dateStr) {
  const key = STORAGE_PREFIX + dateStr;
  localStorage.removeItem(key); //
}

/**
 * ④ localStorageから全日記データを読み込む（forループ）
 * キーが "diary_" で始まるものだけを対象にする
 */
function getAllDiaryKeys() {
  const keys = [];
  // localStorage.length でデータの件数を取得
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i); //
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

// ===================================================
//  カレンダー生成
// ===================================================

/**
 * カレンダーを描画する
 * - 月の最初の日の曜日からグリッドを開始
 * - localStorageに記録があれば気分絵文字を表示
 */
function renderCalendar(year, month) {
  // 月ラベルを更新
  document.getElementById("current-month-label").textContent =
    `${year}年${month + 1}月`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = ""; // いったん空にする

  // その月の1日と末日を取得
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // 1日の曜日（0=日, 1=月 ... 6=土）
  const startWeekday = firstDay.getDay();

  // 空白セルを先頭に追加（1日の曜日分だけずらす）
  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("calendar-cell", "empty");
    grid.appendChild(emptyCell);
  }

  // 日付セルを生成
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date    = new Date(year, month, day);
    const dateStr = formatDateKey(date);
    const weekday = date.getDay(); // 0=日, 6=土

    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");
    cell.dataset.date = dateStr;

    // 今日かどうか
    if (dateStr === todayStr) {
      cell.classList.add("today");
    }

    // この日の日記データを確認
    const diaryData = getDiaryData(dateStr);

    // 日付の数字
    const daySpan = document.createElement("span");
    daySpan.classList.add("cell-day");
    daySpan.textContent = day;
    if (weekday === 0) daySpan.classList.add("sunday");
    if (weekday === 6) daySpan.classList.add("saturday");
    cell.appendChild(daySpan);

    // 花丸マーク（日記データがある場合）
    if (diaryData) {
      cell.classList.add("has-entry");
      const flowerImg = document.createElement("img");
      flowerImg.src = "img/hanamaru.png";
      flowerImg.alt = "花丸";
      flowerImg.classList.add("cell-flower");
      cell.appendChild(flowerImg);
    }

    // クリックイベント → モーダルを開く
    cell.addEventListener("click", function () {
      openModal(this.dataset.date);
    });

    grid.appendChild(cell);
  }
}

// ===================================================
//  モーダル操作
// ===================================================

/**
 * モーダルを開く
 */
function openModal(dateStr) {
  selectedDateStr = dateStr;

  // 日付表示を更新
  const { main, weekday } = formatDateDisplay(dateStr);
  document.getElementById("modal-date-title").textContent =
    `${main}${weekday}の日記`;

  // 既存データがあれば読み込む
  const existing = getDiaryData(dateStr);
  if (existing) {
    document.getElementById("diary-text").value     = existing.diary   || "";
    document.getElementById("counselor-text").value = existing.comment || "";
  } else {
    // 新規：テキストエリアを空にする
    document.getElementById("diary-text").value     = "";
    document.getElementById("counselor-text").value = "";
  }

  // モーダルを表示
  document.getElementById("modal").classList.remove("hidden");
  document.body.style.overflow = "hidden"; // 背景スクロール防止
}

/**
 * モーダルを閉じる
 */
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  document.body.style.overflow = "";
  selectedDateStr = null;
}

// ===================================================
//  保存・削除処理
// ===================================================

/**
 * 「保存する」ボタン
 */
function handleSave() {
  if (!selectedDateStr) return;

  const diaryText   = document.getElementById("diary-text").value.trim();
  const counselorText = document.getElementById("counselor-text").value.trim();

  if (!diaryText && !counselorText) {
    showToast("⚠️ 内容を入力してから保存してください", "warning");
    return;
  }

  // 保存するデータをオブジェクトにまとめる
  const data = {
    date:    selectedDateStr,
    diary:   diaryText,
    comment: counselorText,
    savedAt: new Date().toISOString()
  };

  // ★ localStorageに保存（JSON.stringifyでオブジェクトを文字列化）
  saveDiaryData(selectedDateStr, data);

  // カレンダーを再描画（絵文字を反映させる）
  renderCalendar(currentYear, currentMonth);

  closeModal();
  showToast("💾 保存しました！", "success");
}

/**
 * 「削除する」ボタン
 */
function handleDelete() {
  if (!selectedDateStr) return;

  const existing = getDiaryData(selectedDateStr);
  if (!existing) {
    showToast("⚠️ この日の日記はまだありません", "warning");
    return;
  }

  if (!confirm("この日記を削除しますか？")) return;

  // ★ localStorageから1件削除（removeItem）
  deleteDiaryData(selectedDateStr);

  // カレンダーを再描画（絵文字が消える）
  renderCalendar(currentYear, currentMonth);

  closeModal();
  showToast("🗑 削除しました", "deleted");
}

// ===================================================
//  トースト通知
// ===================================================

let toastTimer = null;

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className   = `toast show ${type}`;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 2500);
}

// ===================================================
//  イベントリスナー登録
// ===================================================

// 前の月へ
document.getElementById("prev-month").addEventListener("click", function () {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentYear, currentMonth);
});

// 次の月へ
document.getElementById("next-month").addEventListener("click", function () {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
});

// モーダルを閉じる（✕ボタン）
document.getElementById("modal-close-btn").addEventListener("click", closeModal);

// モーダルを閉じる（背景クリック）
document.getElementById("modal-backdrop").addEventListener("click", closeModal);

// 保存ボタン
document.getElementById("save-btn").addEventListener("click", handleSave);

// 削除ボタン
document.getElementById("delete-btn").addEventListener("click", handleDelete);

// キーボード操作：Escキーでモーダルを閉じる
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal();
  }
});

// ===================================================
//  初期化（ページ読み込み時）
// ===================================================

// カレンダーを描画（初期表示）
renderCalendar(currentYear, currentMonth);
