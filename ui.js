// 要素を取得します。
const overlay = document.getElementById("overlay");
const tabs = document.querySelectorAll(".tab-list__item");
const tabContentsApplyStyle = document.querySelectorAll(".apply-style");
const tabContentsCreateStyle = document.querySelectorAll(".create-style");
const indicator = document.querySelector(".tab-list-active-indicator");
const loader = document.querySelectorAll(".loading-indicator");
let applyStyleItems;
let applyStyleEditButtons;
let applyStyleDeleteButtons;

// CreateStyleボタン押下時の処理
const createStyleButton = document.querySelector(
  ".create-style__submit-button"
);
const applyStyleList = document.querySelector(".apply-style__list");

// スクロールバーの表示と動作を制御するJavaScriptコード

document.addEventListener("DOMContentLoaded", (event) => {
  const scrollContainer = document.querySelector(".apply-style__list");
  const scrollBar = document.querySelector(
    ".scroll_container--scrollBar--YLWIi"
  );
  let isDragging = false;

  // スクロールバーの高さを計算する関数
  const setScrollBarHeight = () => {
    const visibleRatio =
      scrollContainer.clientHeight / scrollContainer.scrollHeight;
    const scrollBarHeight = Math.max(
      visibleRatio * scrollContainer.clientHeight,
      10
    ); // 最小高さが10pxであることを保証
    scrollBar.style.height = scrollBarHeight + "px";
    scrollBar.style.display = "block"; // スクロールバーを表示
  };

  // スクロールバーとスクロールコンテナの関連付け
  const updateScrollBarPosition = () => {
    const scrollFraction =
      scrollContainer.scrollTop /
      (scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const topPosition =
      scrollFraction *
      (scrollContainer.clientHeight - scrollBar.offsetHeight);
    scrollBar.style.transform = `translate3d(0px, ${topPosition}px, 0px)`;
  };

  // イベントリスナー: マウスホイールでのスクロール操作
  scrollContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    const deltaY = e.deltaY * 0.5;
    scrollContent(deltaY);
  });

  // スクロールイベントにより、カスタムスクロールバーを更新
  scrollContainer.addEventListener("scroll", () => {
    updateScrollBarPosition();
  });

  // スクロール関数
  const scrollContent = (deltaY) => {
    scrollContainer.scrollTop += deltaY;
  };

  // ドラッグイベント用のヘルパー関数
  const startDrag = (e) => {
    isDragging = true;
    scrollBar.classList.add("dragging");
    document.body.classList.add("scrollbar-dragging");
  };

  const endDrag = (e) => {
    isDragging = false;
    scrollBar.classList.remove("dragging");
    document.body.classList.remove("scrollbar-dragging");
  };

  const doDrag = (e) => {
    if (isDragging) {
      const deltaY =
        e.movementY *
        (scrollContainer.scrollHeight / scrollContainer.clientHeight);
      scrollContent(deltaY);
    }
  };

  // ドラッグイベントリスナー
  scrollBar.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", doDrag);
  document.addEventListener("mouseup", endDrag);

  // スクロールバーの高さの初期設定
  setScrollBarHeight();
  updateScrollBarPosition();
});

// 選択された要素とstyleの状態を表示
let selectedName = null;
let selectedEnv = null;
let hasSelection = false;
let isEnvSelected = false;

// 利用可能な全フォント情報を格納する変数
let availableFonts = []; // Figma APIから取得するデータ

// 利用可能なフォントをロードするためにメインスクリプトに要求する
parent.postMessage({ pluginMessage: { type: "load-fonts-request" } }, "*");

// タブ切り替え設定
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    activateTab(tab);
    // タブの内容を切り替える
    toggleTabContents(index);
    toggleTabContentAndResize(index);
  });
});
activateTab(tabs[0]);
toggleTabContents(0);
toggleTabContentAndResize(0);

// タブコンテンツの表示切り替えを行う関数
function toggleTabContents(index) {
  // Apply Stylesタブが選択された場合（index 0）
  if (index === 0) {
    tabContentsApplyStyle.forEach((content) =>
      content.classList.remove("hidden")
    );
    tabContentsCreateStyle.forEach((content) =>
      content.classList.add("hidden")
    );
  }
  // Create Styleタブが選択された場合（index 1）
  else if (index === 1) {
    tabContentsApplyStyle.forEach((content) =>
      content.classList.add("hidden")
    );
    tabContentsCreateStyle.forEach((content) =>
      content.classList.remove("hidden")
    );
  }
}
// タブが選択された際の関数を定義します。
function activateTab(tab) {
  // すべてのタブからアクティブクラスを取り除きます。
  tabs.forEach((t) => {
    t.classList.remove("tab-list__item--active");
  });

  // 選択されたタブにアクティブクラスを追加します。
  tab.classList.add("tab-list__item--active");

  // インジケーターを活性状態にして、選択されたタブの位置に合わせます。
  indicator.style.display = "block";
  indicator.style.width = "67px";
  indicator.style.left = `${tab.offsetLeft}px`;
}

// UI側のスクリプト内で、タブの切り替えイベントを扱う
function toggleTabContentAndResize(index) {
  // 新しい高さを計算する処理...
  let newHeight;
  let newWidth;
  // Apply Stylesタブが選択された場合（index 0）
  if (index === 0) {
    newHeight = 463;
    newWidth = 324;
  }
  // Create Styleタブが選択された場合（index 1）
  else if (index === 1) {
    newHeight = 373;
    newWidth = 324;
  }

  // メインスクリプトに新しい高さを通知
  parent.postMessage(
    { pluginMessage: { type: "resize-ui", width: newWidth, height: newHeight } },
    "*"
  );
}

// ローディング設定
const circumference = 2 * Math.PI * 52;

// 最初に円をリングとして表示するために、
// stroke-dasharrayとstroke-dashoffsetを円周の長さにセットします
const circle = document.querySelector(".progress-ring__circle");
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
  // パーセントに応じたオフセットを計算します
  const offset = circumference - (percent / 100) * circumference;
  // オフセットを設定することでリングを描画します
  circle.style.strokeDashoffset = offset;
}

// メッセージがプラグインから送信されたときにイベントを発火させる
window.onmessage = (event) => {
  const message = event.data.pluginMessage;

  // 共通のエレメントを取得
  const textElement = document.querySelector(
    ".apply-style__message .apply-style__text"
  ); // textElementをここで定義
  const loadingIndicator = document.getElementById("loadingIndicator");

  switch (message.type) {
    // 選択した要素関連メッセージ
    case "selection-cleared":
      textElement.innerHTML =
        "Select the element whose <br> text you want to change";
      textElement.style.color = "var(--figma-color-text-disabled)";
      textElement.style.fontWeight = "400";
      hasSelection = false;
      updateButtonState();
      break;
    case "update-name":
      textElement.textContent = message.name;
      textElement.style.color = "var(--figma-color-text)";
      textElement.style.fontWeight = "600";
      hasSelection = true;
      updateButtonState();
      break;
    case "update-progress":
      loadingIndicator.classList.remove("hidden");
      // 進捗状況のパーセンテージを受け取る
      const progressPercent = event.data.pluginMessage.progress;
      // 進捗インジケータを更新する
      setProgress(progressPercent);
      break;
    case "hide-loading":
      loadingIndicator.classList.add("hidden");
      break;
    case "load-fonts":
      // メッセージからフォント情報を取得する
      availableFonts = message.fonts;
      let fontFamilyListContainers;

      fontFamilyListContainers = document.querySelectorAll(
        ".font-family-list-container"
      );
      // listContainer領域外のクリックを検知するための関数

      function handleDocumentClick(event) {
        fontFamilyListContainers.forEach((listContainer) => {
          // クリックがlistContainerまたはtoggle内のものでない場合、hiddenクラスを追加
          if (
            listContainer.contains(event.target) ||
            listContainer.previousElementSibling.contains(event.target)
          ) {
            // クリックしたのがlistContainer内、もしくはlistContainerに隣接する要素（toggleボタン）の場合は何もしない
          } else {
            listContainer.classList.add("hidden");
          }
        });
      }

      document.addEventListener("click", handleDocumentClick);

      const createStyleContents = document.querySelectorAll(
        ".create-style__content"
      );
      createStyleContents.forEach((content) => {
        const fontFamilyListContainer = content.querySelector(
          ".font-family-list-container"
        );
        const searchInputContainer = content.querySelector(".font-search");
        const scrollContainer = content.querySelector(".scroll_container");
        setupSearchFunctionality(searchInputContainer, scrollContainer);
        const fontWeightListContainer = content.querySelector(
          ".font-weight-list-container"
        );
        const fontWeightSelectBtn = content.querySelector(
          ".create-style__dropdown-group.font-weight"
        );
        const dropDownToggle = content.querySelector(
          ".create-style__dropdown-toggle.font-family"
        );
        let fontWeightLabel = content.querySelector(
          ".create-style__dropdown-toggle.font-weight .create-style__dropdown-label"
        );

        // 既存のリスト内容を一度クリアする
        scrollContainer.innerHTML = "";

        // 重複せずにフォントファミリー名を記録するためのSetを作成
        const addedFontFamilies = new Set();
        // 各コンテナに同じフォントリストを追加する
        availableFonts.forEach((font) => {
          if (font.fontName.family.localeCompare("ABeeZee") < 0) {
            // 👈 ここでABeeZeeよりも前にあるかどうかを比較
            return; // ABeeZeeより辞書順で前に来る場合はskip（このループのイテレーションをスキップする）
          }
          // フォントファミリー名がSetにまだ追加されていない場合のみ項目を作成する
          if (!addedFontFamilies.has(font.fontName.family)) {
            addedFontFamilies.add(font.fontName.family);

            // 新しいフォントファミリーのメニュー項目を作成
            const item = document.createElement("div");
            item.className = "font-menu__item font-item";
            item.setAttribute("role", "menuitem");

            // フォントファミリー名を表示するためのテキスト部分を作成
            const text = document.createElement("div");
            text.className = "font-menu__text";
            text.textContent = font.fontName.family;
            item.appendChild(text);

            // リストにメニュー項目を追加
            scrollContainer.appendChild(item);
          }
        });

        dropDownToggle.addEventListener("click", () => {
          fontFamilyListContainer.classList.add("hidden");
          // ボタンに関連づけられたリストコンテナを取得する
          if (fontFamilyListContainer) {
            fontFamilyListContainer.classList.toggle("hidden"); // クリックごとにリストの表示・非表示を切り替える
            event.stopPropagation(); // ドキュメントレベルのイベントリスナーが反応しないようにする
          }
        });
        fontWeightSelectBtn.addEventListener("click", () => {
          fontWeightListContainer.classList.add("hidden");
          overlay.classList.remove("hidden");
          document.body.classList.add("menu-open");

          // ボタンに関連づけられたリストコンテナを取得する
          if (fontFamilyListContainer) {
            fontFamilyListContainer.classList.toggle("hidden"); // クリックごとにリストの表示・非表示を切り替える
            event.stopPropagation(); // ドキュメントレベルのイベントリスナーが反応しないようにする
          }
        });

        scrollContainer.childNodes.forEach((item) => {
          item.addEventListener("click", (event) => {
            const fontName = item.textContent;
            // 親の '.create-style__dropdown' を取得して、関連するラベルを更新する
            const dropDown = fontFamilyListContainer.closest(
              ".create-style__dropdown"
            );
            const label = dropDown.querySelector(
              ".create-style__dropdown-label"
            );
            if (label) {
              label.textContent = fontName;
            }

            fontFamilyListContainer.classList.add("hidden"); // 項目を選択した後、リストを閉じる
            makeFontWeightLists(
              fontName,
              fontWeightListContainer,
              fontWeightLabel
            );

            // リストアイテムのイベントが「ボタン」までバブリングしてボタンのクリックイベントが発火するのを防ぐ
            event.stopPropagation();
          });
        });
        fontWeightSelectBtn.addEventListener("click", function () {
          if (fontWeightListContainer.classList.contains("hidden")) {
            // 現在のフォントファミリーラベルからフォント名を取得
            const currentFontFamily = content.querySelector(
              ".create-style__dropdown-toggle.font-family .create-style__dropdown-label"
            ).textContent;
            // 表示されるべきフォントウェイト一覧を表示する
            makeFontWeightLists(
              currentFontFamily,
              fontWeightListContainer,
              fontWeightLabel
            );
            fontWeightListContainer.classList.remove("hidden");
          } else {
            fontWeightListContainer.classList.add("hidden"); // リストを閉じる
          }
        });
      });
      break;
    case "add-style-to-list":
      applyStyleItems = document.querySelectorAll(".apply-style__item");

      // 新しいリストアイテムを作成
      const styleName = message.styleName;
      const env = message.env;

      let isEnvExists = false;
      applyStyleItems.forEach((item) => {
        if (item.getAttribute("data-env") === env) {
          isEnvExists = true;
        }
      });

      // 既に存在する場合は、新しいリストアイテムの追加をスキップする
      if (isEnvExists) {
        break;
      }

      const newItem = document.createElement("li");
      newItem.classList.add("apply-style__item");
      newItem.setAttribute("data-env", env);

      // リストアイテムに追加するHTMLコンテンツを設定
      newItem.innerHTML = `
        <div class="apply-style__item-content">
          <h3 class="apply-style__item-title">${styleName}</h3>
        </div>
        <button
          class="apply-style__options-button edit"
          tabindex="0"
          aria-label="その他のオプション"
          data-tooltip-type="text"
          data-tooltip="その他のオプション"
        >
          <span class="apply-style__options-svg-container">
            <svg
              class="apply-style__options-svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 16.05V9H13V16.05C14.1411 16.2816 15 17.2905 15 18.5C15 19.7095 14.1411 20.7184 13 20.95V23H12V20.95C10.8589 20.7184 10 19.7095 10 18.5C10 17.2905 10.8589 16.2816 12 16.05ZM14 18.5C14 19.3284 13.3284 20 12.5 20C11.6716 20 11 19.3284 11 18.5C11 17.6716 11.6716 17 12.5 17C13.3284 17 14 17.6716 14 18.5ZM19 23H20V15.95C21.1411 15.7184 22 14.7095 22 13.5C22 12.2905 21.1411 11.2816 20 11.05V9H19V11.05C17.8589 11.2816 17 12.2905 17 13.5C17 14.7095 17.8589 15.7184 19 15.95V23ZM21 13.5C21 12.6716 20.3284 12 19.5 12C18.6716 12 18 12.6716 18 13.5C18 14.3284 18.6716 15 19.5 15C20.3284 15 21 14.3284 21 13.5Z"
              />
            </svg>
          </span>
        </button>
        <div class="apply-style__popup edit">
          <div class="apply-style__popup-arrow-container">
            <div class="apply-style__popup-content">Edit style</div>
            <div class="apply-style__popup-arrow">
              <svg
                width="13"
                height="7"
                viewBox="0 0 13 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6.5 0L13 6.5H0L6.5 0Z" fill="#222222" />
              </svg>
            </div>
          </div>
        </div>
        <button
          class="apply-style__options-button delete"
          tabindex="0"
          aria-label="その他のオプション"
          data-tooltip-type="text"
          data-tooltip="その他のオプション"
        >
          <span class="apply-style__options-svg-container">
            <svg
              class="apply-style__options-svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M15 9.5C14.4477 9.5 14 9.94772 14 10.5H18C18 9.94772 17.5523 9.5 17 9.5H15ZM19 10.5C19 9.39543 18.1046 8.5 17 8.5H15C13.8954 8.5 13 9.39543 13 10.5H11.5H10V11.5H11V21.5C11 22.6046 11.8954 23.5 13 23.5H19C20.1046 23.5 21 22.6046 21 21.5V11.5H22V10.5H20.5H19ZM20 11.5H18.5H13.5H12V21.5C12 22.0523 12.4477 22.5 13 22.5H19C19.5523 22.5 20 22.0523 20 21.5V11.5ZM14 18.5V14.5H15V18.5H14ZM17 18.5V14.5H18V18.5H17Z"
              />
            </svg>
          </span>
        </button>

        <div class="apply-style__popup delete">
          <div class="apply-style__popup-arrow-container">
            <div class="apply-style__popup-content">Delete style</div>
            <div class="apply-style__popup-arrow">
              <svg
                width="13"
                height="7"
                viewBox="0 0 13 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6.5 0L13 6.5H0L6.5 0Z" fill="#222222" />
              </svg>
            </div>
          </div>
        </div>
        <!-- その他のオプションボタンとポップアップ、メニューなどを含むHTMLをここに追加 -->
      `;

      // apply-style__listの要素に新しいリストアイテムを追加
      applyStyleList.appendChild(newItem);

      // 新しいリストアイテムに関するイベントをここで追加しています
      newItem.addEventListener("click", function (e) {
        // クリックイベントのバブリングを止める
        e.stopPropagation();

        // 他のアイテムのアクティブ状態を解除
        removeAllActiveItems();
        removeAllActiveButtons();

        // クリックされたアイテムにアクティブクラスを切り替え
        newItem.classList.toggle("active");
        selectedName = newItem.querySelector(
          ".apply-style__item-title"
        ).textContent; // スタイル名を取得
        selectedEnv = newItem.getAttribute("data-env"); // 環境を取得

        // ボタンの状態を更新
        updateButtonState();
      });

      // 設定/編集ボタンに関するイベントリスナーをここで追加できます。
      const applyStyleEditButton = newItem.querySelector(
        ".apply-style__options-button.edit"
      );
      const applyStyleDeleteButton = newItem.querySelector(
        ".apply-style__options-button.delete"
      );
      applyStyleEditButton.addEventListener("click", function (e) {
        // イベントのバブリングを阻止
        e.stopPropagation();

        removeAllActiveButtons();

        // クリックされた要素がボタン自体ではなく子要素の場合、closestを使用してボタン要素を取得
        const buttonElement = e.target.closest(
          ".apply-style__options-button"
        );

        // ボタンのアクティブ状態をトグルする
        const isActive = buttonElement.classList.toggle("active");
        if (isActive) {
          overlay.classList.remove("hidden");
          document.body.classList.add("menu-open");
          // アクティブになったとき
          // if (popup) {
          //   popup.style.display = "none";
          // }
          // if (menu) {
          //   menu.style.display = "block";
          // }
        } else {
          // アクティブでないとき（別の処理が必要な場合のみ）
          overlay.classList.add("hidden");
          document.body.classList.remove("menu-open");
        }

        // 他のアクティブな項目を非アクティブにする
        removeAllActiveItems();
      });
      applyStyleDeleteButton.addEventListener("click", function (e) {
        e.stopPropagation(); // イベントバブリングを防ぐ
        const envValue = newItem.getAttribute("data-env");
        let itemToDelete = document.querySelector(
          `.apply-style__item[data-env="${envValue}"]`
        ); // DOM 要素を取得
        if (itemToDelete) {
          itemToDelete.remove(); // DOM 要素を削除
        }
        parent.postMessage(
          {
            pluginMessage: {
              type: "delete-style",
              env: newItem.getAttribute("data-env"),
            },
          },
          "*"
        );
      });
      break;
  }
};
// 検索機能を設定する関数
function setupSearchFunctionality(searchInputContainer, scrollContainer) {
  // 検索イベントリスナーを追加
  searchInputContainer.addEventListener("input", function () {
    let searchText = searchInputContainer.value.toLowerCase();

    if (searchInputContainer) {
      // 検索イベントリスナーを追加
      searchInputContainer.addEventListener("input", function () {
        let searchText = searchInputContainer.value.toLowerCase();

        // この時点でのfont-itemsを再取得する
        let fontItems = scrollContainer.querySelectorAll(".font-item");

        fontItems.forEach(function (item) {
          let fontName = item
            .querySelector(".font-menu__text")
            .textContent.toLowerCase();
          if (fontName.includes(searchText)) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
    }
  });
}
// フォントウェイトを表示する関数
function makeFontWeightLists(
  fontFamilyName,
  fontWeightListContainer,
  fontWeightLabel
) {
  fontWeightListContainer.innerHTML = ""; // コンテナをクリア

  const fontWeights = availableFonts.filter(
    (font) => font.fontName.family === fontFamilyName
  );

  function createCheckIcon() {
    const namespace = "http://www.w3.org/2000/svg"; // SVGの名前空間
    const checkIcon = document.createElementNS(namespace, "svg");
    checkIcon.setAttribute("class", "font-menu__icon hidden");
    checkIcon.setAttribute("viewBox", "0 0 16 16");
    checkIcon.setAttribute("fill", "none");

    const path = document.createElementNS(namespace, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    path.setAttribute(
      "d",
      "M13.2067 5.20718L7.70669 10.7072L6.99959 11.4143L6.29248 10.7072L3.29248 7.70718L4.70669 6.29297L6.99959 8.58586L11.7925 3.79297L13.2067 5.20718Z"
    );
    path.setAttribute("fill", "white");

    checkIcon.appendChild(path);
    return checkIcon;
  }

  let allFontWeightItems = [];
  let defaultFontWeight;
  // 'Regular' があるかどうか確認し、設定する
  const regularFontWeight = fontWeights.find(
    (font) => font.fontName.style === "Regular"
  );

  fontWeights.forEach((font) => {
    // 新しいフォントウェイトのメニュー項目を作成
    const item = document.createElement("div");
    item.className = "font-menu__item";
    item.setAttribute("role", "menuitem");

    // フォントウェイト名を表示するためのテキスト部分を作成
    const text = document.createElement("div");
    text.className = "font-menu__text";
    text.textContent = font.fontName.style;
    item.appendChild(text);

    // チェックアイコンを追加
    const checkIcon = createCheckIcon();
    item.appendChild(checkIcon);

    // リストにメニュー項目を追加
    fontWeightListContainer.appendChild(item);

    // 作成したメニュー項目を配列に追加
    allFontWeightItems.push(item);

    // 項目がクリックされた時の処理を追加
    item.addEventListener("click", () => {
      fontWeightLabel.textContent = font.fontName.style; // ラベルを更新
      fontWeightListContainer.classList.add("hidden"); // フォントウェイトリストを閉じる

      // 他のすべてのアイテムのチェックアイコンにhiddenクラスを追加する
      allFontWeightItems.forEach((cItem) => {
        const icon = cItem.querySelector(".font-menu__icon");
        if (icon) icon.classList.add("hidden");
      });
      updateCheckState(item, allFontWeightItems, checkIcon);

      // 現在選択されたアイテムのチェックアイコンのhiddenクラスを削除する
      checkIcon.classList.remove("hidden");
      event.stopPropagation();
    });

    // デフォルトフォントウェイトを特定する
    if (!defaultFontWeight || font.fontName.style === "Regular") {
      defaultFontWeight = item;
    }
  });
  // デフォルトフォントウェイトをラベルとチェック状態に設定する
  if (defaultFontWeight) {
    fontWeightLabel.textContent = regularFontWeight
      ? "Regular"
      : fontWeights[0].fontName.style;
    updateCheckState(
      defaultFontWeight,
      allFontWeightItems,
      defaultFontWeight.querySelector(".font-menu__icon")
    );
  }
}
// チェック状態の更新を行う関数を追加
function updateCheckState(selectedItem, allItems, selectedCheckIcon) {
  allItems.forEach((cItem) => {
    const icon = cItem.querySelector(".font-menu__icon");
    if (icon) icon.classList.add("hidden");
  });
  selectedCheckIcon.classList.remove("hidden");
}

// ボタンにクリックイベントリスナーを追加
createStyleButton.addEventListener("click", function () {
  // スタイル名のインプット要素から値を取得
  const styleNameInput = document.getElementById("styleNameInput");
  const styleName = styleNameInput.value.trim();
  const timestamp = new Date().toISOString().replace(/[^\d]/g, "");
  // styleName が空でないことを確認します
  if (!styleName) {
    alert("Please enter a style name.");
    return;
  }
  const newItem = document.createElement("li");
  newItem.classList.add("apply-style__item");
  newItem.setAttribute("data-env", `style-${timestamp}`);

  // リストアイテムに追加するHTMLコンテンツを設定
  newItem.innerHTML = `
    <div class="apply-style__item-content">
      <h3 class="apply-style__item-title">${styleName}</h3>
    </div>
    <button
      class="apply-style__options-button edit"
      tabindex="0"
      aria-label="その他のオプション"
      data-tooltip-type="text"
      data-tooltip="その他のオプション"
    >
      <span class="apply-style__options-svg-container">
        <svg
          class="apply-style__options-svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 16.05V9H13V16.05C14.1411 16.2816 15 17.2905 15 18.5C15 19.7095 14.1411 20.7184 13 20.95V23H12V20.95C10.8589 20.7184 10 19.7095 10 18.5C10 17.2905 10.8589 16.2816 12 16.05ZM14 18.5C14 19.3284 13.3284 20 12.5 20C11.6716 20 11 19.3284 11 18.5C11 17.6716 11.6716 17 12.5 17C13.3284 17 14 17.6716 14 18.5ZM19 23H20V15.95C21.1411 15.7184 22 14.7095 22 13.5C22 12.2905 21.1411 11.2816 20 11.05V9H19V11.05C17.8589 11.2816 17 12.2905 17 13.5C17 14.7095 17.8589 15.7184 19 15.95V23ZM21 13.5C21 12.6716 20.3284 12 19.5 12C18.6716 12 18 12.6716 18 13.5C18 14.3284 18.6716 15 19.5 15C20.3284 15 21 14.3284 21 13.5Z"
          />
        </svg>
      </span>
    </button>
    <div class="apply-style__popup edit">
      <div class="apply-style__popup-arrow-container">
        <div class="apply-style__popup-content">Edit style</div>
        <div class="apply-style__popup-arrow">
          <svg
            width="13"
            height="7"
            viewBox="0 0 13 7"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6.5 0L13 6.5H0L6.5 0Z" fill="#222222" />
          </svg>
        </div>
      </div>
    </div>
    <button
      class="apply-style__options-button delete"
      tabindex="0"
      aria-label="その他のオプション"
      data-tooltip-type="text"
      data-tooltip="その他のオプション"
    >
      <span class="apply-style__options-svg-container">
        <svg
          class="apply-style__options-svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15 9.5C14.4477 9.5 14 9.94772 14 10.5H18C18 9.94772 17.5523 9.5 17 9.5H15ZM19 10.5C19 9.39543 18.1046 8.5 17 8.5H15C13.8954 8.5 13 9.39543 13 10.5H11.5H10V11.5H11V21.5C11 22.6046 11.8954 23.5 13 23.5H19C20.1046 23.5 21 22.6046 21 21.5V11.5H22V10.5H20.5H19ZM20 11.5H18.5H13.5H12V21.5C12 22.0523 12.4477 22.5 13 22.5H19C19.5523 22.5 20 22.0523 20 21.5V11.5ZM14 18.5V14.5H15V18.5H14ZM17 18.5V14.5H18V18.5H17Z"
          />
        </svg>
      </span>
    </button>

    <div class="apply-style__popup delete">
      <div class="apply-style__popup-arrow-container">
        <div class="apply-style__popup-content">Delete style</div>
        <div class="apply-style__popup-arrow">
          <svg
            width="13"
            height="7"
            viewBox="0 0 13 7"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6.5 0L13 6.5H0L6.5 0Z" fill="#222222" />
          </svg>
        </div>
      </div>
    </div>
    <!-- その他のオプションボタンとポップアップ、メニューなどを含むHTMLをここに追加 -->
  `;

  // apply-style__listの要素に新しいリストアイテムを追加
  applyStyleList.appendChild(newItem);

  // 新しいリストアイテムに関するイベントをここで追加しています
  newItem.addEventListener("click", function (e) {
    // クリックイベントのバブリングを止める
    e.stopPropagation();

    // 他のアイテムのアクティブ状態を解除
    removeAllActiveItems();
    removeAllActiveButtons();

    // クリックされたアイテムにアクティブクラスを切り替え
    newItem.classList.toggle("active");
    selectedName = newItem.querySelector(
      ".apply-style__item-title"
    ).textContent; // スタイル名を取得
    selectedEnv = newItem.getAttribute("data-env"); // 環境を取得

    // ボタンの状態を更新
    updateButtonState();
  });

  // 設定/編集ボタンに関するイベントリスナーをここで追加できます。
  const applyStyleEditButton = newItem.querySelector(
    ".apply-style__options-button.edit"
  );
  const applyStyleDeleteButton = newItem.querySelector(
    ".apply-style__options-button.delete"
  );
  applyStyleEditButton.addEventListener("click", function (e) {
    // イベントのバブリングを阻止
    e.stopPropagation();

    removeAllActiveButtons();

    // クリックされた要素がボタン自体ではなく子要素の場合、closestを使用してボタン要素を取得
    const buttonElement = e.target.closest(".apply-style__options-button");

    // ボタンのアクティブ状態をトグルする
    const isActive = buttonElement.classList.toggle("active");
    if (isActive) {
      overlay.classList.remove("hidden");
      document.body.classList.add("menu-open");
      // アクティブになったとき
      // if (popup) {
      //   popup.style.display = "none";
      // }
      // if (menu) {
      //   menu.style.display = "block";
      // }
    } else {
      // アクティブでないとき（別の処理が必要な場合のみ）
      overlay.classList.add("hidden");
      document.body.classList.remove("menu-open");
    }

    // 他のアクティブな項目を非アクティブにする
    removeAllActiveItems();
  });
  applyStyleDeleteButton.addEventListener("click", function (e) {
    e.stopPropagation(); // イベントバブリングを防ぐ
    const envValue = newItem.getAttribute("data-env");
    let itemToDelete = document.querySelector(
      `.apply-style__item[data-env="${envValue}"]`
    ); // DOM 要素を取得
    if (itemToDelete) {
      itemToDelete.remove(); // DOM 要素を削除
    }
    parent.postMessage(
      {
        pluginMessage: {
          type: "delete-style",
          env: newItem.getAttribute("data-env"),
        },
      },
      "*"
    );
  });

  // フォントスタイル情報をそれぞれのドロップダウンから取得
  const japaneseFontFamily = document
    .querySelector('[data-lang="Japanese"] [data-label-type="font-family"]')
    .textContent.trim();
  const japaneseFontWeight = document
    .querySelector('[data-lang="Japanese"] [data-label-type="font-weight"]')
    .textContent.trim();
  const englishFontFamily = document
    .querySelector('[data-lang="English"] [data-label-type="font-family"]')
    .textContent.trim();
  const englishFontWeight = document
    .querySelector('[data-lang="English"] [data-label-type="font-weight"]')
    .textContent.trim();

  // 各言語のフォント設定を格納するオブジェクトを作成します
  const fontSettings = {
    Japanese: {
      fontFamily: japaneseFontFamily,
      fontWeight: japaneseFontWeight,
    },
    English: {
      fontFamily: englishFontFamily,
      fontWeight: englishFontWeight,
    },
  };
  // スタイル名とフォント設定をFigmaプラグインのメインコードに送信
  parent.postMessage(
    {
      pluginMessage: {
        type: "save-style",
        styleName: styleName,
        fontSettings: fontSettings,
        key: timestamp, // この部分はユーザーのIDや一意の識別子を使用
      },
    },
    "*"
  );
  styleNameInput.value = "";
});

// Applyボタンの要素を取得し、デフォルトでは無効化する
const applyBtn = document.getElementById("applyBtn");
applyBtn.disabled = true; // 初期状態としてボタンを無効化
// UIのHTML中のスクリプトは以下のようになります。
// UIから送られるメッセージは、上記 figma.ui.onmessage でリッスンされます。
// When the button is clicked, the plugin will start the text analysis and update
applyBtn.addEventListener("click", () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "analyzeAndUpdateText",
        Name: selectedName,
        key: selectedEnv,
      },
    },
    "*"
  );
});

// すべてのボタンのアクティブ状態を解除する関数
function removeAllActiveButtons() {
  document
    .querySelectorAll(".apply-style__options-button.active")
    .forEach((activeButton) => {
      activeButton.classList.remove("active");
    });
}

// すべてのアイテムのアクティブ状態を解除する関数
function removeAllActiveItems() {
  document
    .querySelectorAll(".apply-style__item.active")
    .forEach((activeItem) => {
      activeItem.classList.remove("active");
    });
}

// ドキュメント全体のクリックイベントリスナーを追加
document.addEventListener(
  "click",
  (e) => {
    // クリックが.apply-style__item or .apply-style__options-button要素の内部でなければアクティブクラスを削除
    if (
      !e.target.closest(".apply-style__item") ||
      !e.target.closest(".apply-style__options-button")
    ) {
      // 他のアイテムのアクティブ状態を解除
      // removeShowMenu();
      removeAllActiveItems();
      removeAllActiveButtons();
      selectedEnv = null;
      // ボタンの状態を更新
      updateButtonState();
    }
  },
  false
);

// メニューを非表示にするための関数
function hideMenu() {
  // Apply styles の menu を非表示にする
  document.querySelectorAll(".menu").forEach((menu) => {
    menu.style.display = "none";
  });
  // Create styles の font-style / font-weight menu を非表示にする
  document.querySelectorAll(".create-style__font-menu").forEach((menu) => {
    menu.classList.add("hidden");
  });

  // オーバーレイを非表示にする
  overlay.classList.add("hidden");

  // メニューが開いている状態クラスをbodyから削除
  document.body.classList.remove("menu-open");

  // すべてのアクティブなメニューボタンの状態をリセット
  const activeButtons = document.querySelectorAll(
    ".apply-style__options-button.active"
  );
  activeButtons.forEach((button) => {
    button.classList.remove("active");
  });
}

// オーバーレイがクリックされた時にメニューを非表示にするイベントリスナーを追加
overlay.addEventListener("click", hideMenu);

// アイテムのクリックイベントを設定
applyStyleItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    // クリックイベントのバブリングを止める
    e.stopPropagation();

    // 他のアイテムのアクティブ状態を解除
    removeAllActiveItems();
    removeAllActiveButtons();

    // クリックされたアイテムにアクティブクラスを切り替え
    item.classList.toggle("active");
    selectedEnv = item.getAttribute("data-env"); // 環境を取得

    // ボタンの状態を更新
    updateButtonState();
  });
});

// Applyボタンの有効/無効ステータスを更新する関数
function updateButtonState() {
  // selectedEnvがnullでないかをチェックして、isEnvSelectedを更新する
  isEnvSelected = selectedEnv !== null;
  // Applyボタンは環境が選択され、何かが選択されている場合のみ活性化する
  applyBtn.disabled = !(isEnvSelected && hasSelection);

  if (isEnvSelected && hasSelection) {
    applyBtn.classList.remove("disabled");
    applyBtn.classList.add("active");
  } else {
    applyBtn.classList.remove("active");
    applyBtn.classList.add("disabled");
  }
}