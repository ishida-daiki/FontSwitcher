// プラグイン起動時にすでに保存されているスタイルを UI に送る関数です。
async function loadAndSendStyles() {
  const savedStyleKeys =
    (await figma.clientStorage.getAsync("savedStyleKeys")) || [];

  for (const key of savedStyleKeys) {
    const styleKeyForVerification = `style-${key}`;
    const savedStyle = await figma.clientStorage.getAsync(
      styleKeyForVerification
    );
    if (savedStyle) {
      for (const styleName in savedStyle) {
        figma.ui.postMessage({
          type: "add-style-to-list",
          styleName: styleName,
          env: styleKeyForVerification,
        });
      }
    }
  }
}

figma.showUI(__html__, { themeColors: true, height: 450, width: 324 });

// プラグイン起動時にスタイルを読み込み、UIに送信
loadAndSendStyles();

// 選択した要素を変更したときに発生するイベント
figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    // 何も選択されていない場合
    figma.ui.postMessage({ type: "selection-cleared" });
  } else {
    for (const node of selection) {
      if (
        node.type === "FRAME" ||
        node.type === "GROUP" ||
        node.type === "SECTION" ||
        node.type === "COMPONENT_SET" ||
        node.type === "COMPONENT" ||
        node.type === "INSTANCE" ||
        node.type === "TEXT"
      ) {
        figma.ui.postMessage({ type: "update-name", name: node.name });
      }
    }
  }
});

// 利用可能なフォントファミリーの全ウェイトを返す関数
async function loadAllFontWeights(fontFamily: string) {
  // 利用可能な全フォントを取得
  const availableFonts = await figma.listAvailableFontsAsync();
  // 指定されたフォントファミリーのウェイトのみを抽出
  return availableFonts
    .filter((font) => font.fontName.family === fontFamily)
    .map((font) => font.fontName);
}

figma.ui.onmessage = async (msg) => {
  // Applyボタンを押下したときに発生するイベント
  if (msg.type === "analyzeAndUpdateText") {
    try {
      // ローディングを表示する
      figma.ui.postMessage({ type: "show-loading" });

      const selectedNodes = figma.currentPage.selection;
      const xOffset = 40; // 横軸方向のオフセット
      const cloneSelectedNodes = selectedNodes.map((node) => {
        // 各ノードに対して clone() を呼び出して複製する
        const clonedNode = node.clone();
        clonedNode.x = node.x + node.width + xOffset; // 元のノードの右側に40px離れた位置に設定
        clonedNode.y = node.y; // 縦軸方向の位置は変わらない
        if (node.parent) {
          node.parent.appendChild(clonedNode); // 複製したノードを親要素に追加
        }

        return clonedNode; // 新しく複製されたノードを返す
      });

      // 複製した最上位のノードの名前を最新のレイヤー名（提供されたもの）で更新する
      cloneSelectedNodes.forEach((clonedNode) => {
        // 最上位の親を探す
        const topParent = findTopParent(clonedNode);

        topParent.name = msg.layerName; // 最上位の親ノードの名前を更新
      });

      // 選択中のすべてのノードを探索してテキストノードを収集
      const textNodes = cloneSelectedNodes.reduce<TextNode[]>(
        (collection, currentNode) => {
          if ("children" in currentNode) {
            const frameTextNodes = currentNode.findAll(
              (node) => node.type === "TEXT"
            ) as TextNode[];
            return collection.concat(frameTextNodes);
          } else if (currentNode.type === "TEXT") {
            collection.push(currentNode);
          }
          return collection;
        },
        []
      );

      // 処理するノードの数をカウント
      const totalNodes = textNodes.length;
      let processedNodes = 0;

      // フォント設定を"key"に基づいて取得
      let styleKey = msg.key; // clientStorageから取得するためのキー
      let styleName = msg.selectedStyleName; // clientStorageから取得するためのキー

      let savedStyles = (await figma.clientStorage.getAsync(styleKey)) || {};

      const customFontsToLoad: Promise<FontName[]>[] = (
        Object.values(savedStyles) as CustomFontSettings[]
      ).map(async (style) => {
        let fontsToLoad: FontName[] = [];

        if (style.Japanese.fontWeight === "Auto") {
          fontsToLoad.push(
            ...(await loadAllFontWeights(style.Japanese.fontFamily))
          );
        } else {
          fontsToLoad.push({
            family: style.Japanese.fontFamily,
            style: style.Japanese.fontWeight,
          });
        }

        if (style.English.fontWeight === "Auto") {
          fontsToLoad.push(
            ...(await loadAllFontWeights(style.English.fontFamily))
          );
        } else {
          fontsToLoad.push({
            family: style.English.fontFamily,
            style: style.English.fontWeight,
          });
        }

        return fontsToLoad;
      });

      // Promise.allを使用して非同期処理の結果を待ちます
      const customFontsToLoadResults = await Promise.all(customFontsToLoad);
      // 結果の配列をフラット化して、FontName[]型となるようにします
      const allFontNamesToLoad: FontName[] = customFontsToLoadResults.flat();

      for (const font of allFontNamesToLoad) {
        // フォントのオブジェクトが正しくフォーマットされているか確認します
        if (font && font.family && font.style) {
          await figma.loadFontAsync(font);
        }
      }
      // fontSettingsの取得
      const fontSettings: CustomFontSettings | undefined =
        savedStyles[styleName];

      if (!fontSettings || !fontSettings.Japanese || !fontSettings.English) {
        throw new Error("The font settings are missing or invalid.");
      }

      for (const textNode of textNodes) {
        await processTextNodes(textNode, fontSettings);

        // 処理されたノードの数をインクリメント
        processedNodes++;

        // 進捗率を計算してUIに送信
        const progress = (processedNodes / totalNodes) * 100;
        figma.ui.postMessage({ type: "update-progress", progress: progress });
      }

      // ローディングを非表示にする
      figma.ui.postMessage({ type: "hide-loading" });
    } catch (error) {
      // エラーをコンソールに出力
      console.error("Error processing text nodes:", error);
    } finally {
      // ローディングを非表示にする
      figma.ui.postMessage({ type: "hide-loading" });
    }
  }
  // メッセージ受信ハンドラ
  else if (msg.type === "load-fonts-request") {
    const fonts = await figma.listAvailableFontsAsync();
    figma.ui.postMessage({ type: "load-fonts", fonts });
  } else if (msg.type === "save-style") {
    const { styleName, fontSettings, key } = msg;

    // スタイルを保存して完了を待ちます
    await saveStyleForUser(styleName, fontSettings, key);
    // UIに直接新しいスタイルを送信
    const styleKeyForVerification = `style-${key}`;
    figma.ui.postMessage({
      type: "add-style-to-list",
      styleName: styleName,
      env: styleKeyForVerification,
    });
  } else if (msg.type === "delete-style") {
    deleteDataFromClientStorage(msg.env);
  } else if (msg.type === "resize-ui") {
    figma.ui.resize(msg.width, msg.height);
  }
};

// 最上位の親を探す処理
function findTopParent(node: SceneNode): SceneNode {
  while (node.parent && node.parent.type !== "PAGE") {
    node = node.parent as SceneNode;
  }
  return node;
}

interface CustomFontName {
  fontFamily: string;
  fontWeight: string;
}

// 具体的なフォント設定の型を定義する
interface CustomFontSettings {
  Japanese: CustomFontName;
  English: CustomFontName;
}
// 具体的なフォント設定の型を定義する
interface SavedFontSettings {
  Japanese: FontName;
  English: FontName;
}

async function saveStyleForUser(
  styleName: string,
  fontSettings: { Japanese: FontName; English: FontName },
  env: string
) {
  // ここでenvの値を一意なキーとして使用します
  const styleKey = `style-${env}`;
  let savedStyles = (await figma.clientStorage.getAsync(styleKey)) || {};
  savedStyles[styleName] = fontSettings; // 新しいスタイルを追加
  await figma.clientStorage.setAsync(styleKey, savedStyles);

  // 保存されているスタイルキーのリストを更新
  let savedStyleKeys =
    (await figma.clientStorage.getAsync("savedStyleKeys")) || [];
  if (!savedStyleKeys.includes(env)) {
    savedStyleKeys.push(env);
    await figma.clientStorage.setAsync("savedStyleKeys", savedStyleKeys);
  }
}

// ここに各フォントスタイルに対する数値的ウェイトをマッピングするオブジェクトを定義
const fontWeightValues: { [styleName: string]: number } = {
  Ultralight: 100,
  Thin: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  Semibold: 600,
  SemiBold: 600,
  Bold: 700,
  Heavy: 800,
  ExtraBold: 800,
  Black: 900,
};
// 指定されたフォントファミリーに最も近いフォントウェイトを探す関数
async function findClosestFontWeight(
  family: string,
  defaultWeight: string
): Promise<string> {
  const fonts = await figma.listAvailableFontsAsync();
  const familyFonts = fonts.filter((font) => font.fontName.family === family);
  let closestWeight = "Regular"; // デフォルト値、見つからない場合に使う
  let exactMatchFound = false; // 完全一致したかどうかを追跡するためのフラグ
  let minimumDifference = Infinity; // 最小のウェイト差を保持する変数

  // デフォルトのウェイトを小文字に変換
  const defaultWeightLower = defaultWeight.toLowerCase();

  // 利用可能なフォントウェイトを走査して、完全一致を探します。
  for (const availableFont of familyFonts) {
    // availableFont.fontName.styleも小文字に変換して比較
    const availableFontWeightLower = availableFont.fontName.style.toLowerCase();

    if (availableFontWeightLower === defaultWeightLower) {
      closestWeight = availableFont.fontName.style; // 完全一致が見つかれば設定
      exactMatchFound = true;
      console.log("Exact match found:", closestWeight);
      break; // ループを抜けます
    } else if (fontWeightValues.hasOwnProperty(availableFontWeightLower)) {
      // weightDifferenceは常に正の値にして、Infinityで初期化されたminimumDifferenceと比較します
      const weightDifference = Math.abs(
        fontWeightValues[defaultWeight] - fontWeightValues[availableFont.fontName.style]
      );

      if (weightDifference < minimumDifference) {
        closestWeight = availableFont.fontName.style; // 最も近いウェイトを更新
        minimumDifference = weightDifference;
      }
    } else {
      // fontWeightValues に定義されていない場合はスキップ
      console.error("Undefined weight name:", availableFont.fontName.style);
      continue; // 次のイテレーションにスキップ
    }
  }

  // ここで結果が確定
  if (exactMatchFound) {
    console.log("Exact match found, no need for further processing.");
  } else {
    console.log("No exact match found, closest weight selected:", closestWeight);
  }

  return closestWeight;
}
// テキストノード処理ロジックを関数化
async function processTextNodes(
  textNode: TextNode,
  fontSettings: CustomFontSettings
) {
  let defaultFontWeight: string | undefined;
  const japaneseFontWeight = fontSettings.Japanese.fontWeight;
  const englishFontWeight = fontSettings.English.fontWeight;
  // テキストノードに既に設定されているフォントをロード
  if (textNode.fontName !== figma.mixed) {
    await figma.loadFontAsync(textNode.fontName as FontName);
    defaultFontWeight = textNode.fontName.style;
  } else {
    console.log("fontName is mixed, cannot determine a single style.");
  }

  const characters = textNode.characters;

  for (const segment of textNode.getStyledTextSegments([
    "fontName",
    "fontWeight",
  ])) {
    const { start, end } = segment;
    const textSegment = characters.slice(start, end);

    // japanese
    if (japaneseFontWeight === "Auto") {
      const closestWeight = await findClosestFontWeight(
        fontSettings.Japanese.fontFamily,
        defaultFontWeight as string
      );
      fontSettings.Japanese.fontWeight = closestWeight;
    }

    // english
    if (englishFontWeight === "Auto") {
      const closestWeight = await findClosestFontWeight(
        fontSettings.English.fontFamily,
        defaultFontWeight as string
      );
      fontSettings.English.fontWeight = closestWeight;
    }

    let fontName: FontName;

    // 日本語文字判定
    if (
      /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(
        textSegment
      )
    ) {
      fontName = {
        family: fontSettings.Japanese.fontFamily, // fontFamily から family に
        style: fontSettings.Japanese.fontWeight, // fontWeight から style に
      };
    }
    // 英数字（および記号）判定 - 日本語以外をデフォルトでここで処理する
    else {
      fontName = {
        family: fontSettings.English.fontFamily, // fontFamily から family に
        style: fontSettings.English.fontWeight, // fontWeight から style に
      };
    }

    for (let i = start; i < end; i++) {
      // figma.loadFontAsyncに渡すのはFontName型である必要があります（修正前の不要なプロパティ削除）
      // await figma.loadFontAsync(fontName);
      textNode.setRangeFontName(i, i + 1, fontName);
    }
  }
}
async function deleteDataFromClientStorage(key: string) {
  try {
    await figma.clientStorage.deleteAsync(key);
  } catch (error) {
    console.error("データの削除中にエラーが発生しました: ", error);
  }
}
// figma.closePlugin();
