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

figma.showUI(__html__, { themeColors: true, height: 460, width: 324 });

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

figma.ui.onmessage = async (msg) => {
  // Applyボタンを押下したときに発生するイベント
  if (msg.type === "analyzeAndUpdateText") {
    try {
      // ローディングを表示する
      figma.ui.postMessage({ type: "show-loading" });

      const selectedNodes = figma.currentPage.selection;
      const xOffset = 40; // 横軸方向のオフセット
      const cloneSelectedNodes = selectedNodes.map(node => {
        // 各ノードに対して clone() を呼び出して複製する
        const clonedNode = node.clone();
        clonedNode.x = node.x + node.width + xOffset; // 元のノードの右側に40px離れた位置に設定
        clonedNode.y = node.y; // 縦軸方向の位置は変わらない
        if (node.parent) {
          node.parent.appendChild(clonedNode); // 複製したノードを親要素に追加
        }
        
        return clonedNode; // 新しく複製されたノードを返す
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
      let styleName = msg.Name; // clientStorageから取得するためのキー

      let savedStyles = (await figma.clientStorage.getAsync(styleKey)) || {};

      const customFontsToLoad: FontName[] = (
        Object.values(savedStyles) as CustomFontSettings[]
      ).flatMap((style) => [
        { family: style.Japanese.fontFamily, style: style.Japanese.fontWeight },
        { family: style.English.fontFamily, style: style.English.fontWeight },
      ]);

      for (const font of customFontsToLoad) {
        // フォントのオブジェクトが正しくフォーマットされているか確認します
        if (font && font.family && font.style) {
          await figma.loadFontAsync(font as FontName);
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

// テキストノード処理ロジックを関数化
async function processTextNodes(
  textNode: TextNode,
  fontSettings: CustomFontSettings,
) {
  // テキストノードに既に設定されているフォントをロード
  if (textNode.fontName !== figma.mixed) {
    await figma.loadFontAsync(textNode.fontName as FontName);
  }

  const characters = textNode.characters;

  for (const segment of textNode.getStyledTextSegments([
    "fontName",
    "fontWeight",
  ])) {
    const { start, end } = segment;
    const textSegment = characters.slice(start, end);

    let fontName: FontName;

    // 日本語文字判定
    if (
      /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(
        textSegment
      )
    ) {
      fontName = {
        family: fontSettings.Japanese.fontFamily, // fontFamily から family に
        style: fontSettings.Japanese.fontWeight   // fontWeight から style に
      };
    }
    // 英数字（および記号）判定 - 日本語以外をデフォルトでここで処理する
    else {
      fontName = {
        family: fontSettings.English.fontFamily, // fontFamily から family に
        style: fontSettings.English.fontWeight   // fontWeight から style に
      };
    }

    for (let i = start; i < end; i++) {
      // figma.loadFontAsyncに渡すのはFontName型である必要があります（修正前の不要なプロパティ削除）
      await figma.loadFontAsync(fontName);
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