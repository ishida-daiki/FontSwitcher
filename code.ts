// プラグイン起動時にすでに保存されているスタイルを UI に送る関数です。
async function loadAndSendStyles() {
  const savedStyleKeys = await figma.clientStorage.getAsync('savedStyleKeys') || [];
  for (const key of savedStyleKeys) {
    const styleKeyForVerification = `style-${key}`;
    const savedStyle = await figma.clientStorage.getAsync(styleKeyForVerification);
    if (savedStyle) {
      for (const styleName in savedStyle) {
        figma.ui.postMessage({
          type: 'add-style-to-list',
          styleName: styleName,
          env: styleKeyForVerification,
        });
      }
    }
  }
}


figma.showUI(__html__, {themeColors: true, height: 460, width: 324});


// プラグイン起動時にスタイルを読み込み、UIに送信
loadAndSendStyles();

// 選択した要素を変更したときに発生するイベント
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    // 何も選択されていない場合
    figma.ui.postMessage({ type: 'selection-cleared' });
  } else {
    for (const node of selection) {
      if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION' || node.type === 'COMPONENT_SET' || node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'TEXT') {
        figma.ui.postMessage({ type: 'update-name', name: node.name });
      }
    }
  }
});

figma.ui.onmessage = async (msg) => {
  // Applyボタンを押下したときに発生するイベント
  if (msg.type === 'analyzeAndUpdateText') {
    try {
      // ローディングを表示する
      figma.ui.postMessage({ type: 'show-loading' });
  
      const selectedNodes = figma.currentPage.selection;
  
      // 選択中のすべてのノードを探索してテキストノードを収集
      const textNodes = selectedNodes.reduce<TextNode[]>((collection, currentNode) => {
        if ("children" in currentNode) {
          const frameTextNodes = currentNode.findAll(node => node.type === 'TEXT') as TextNode[];
          return collection.concat(frameTextNodes);
        } else if (currentNode.type === 'TEXT') {
          collection.push(currentNode);
        }
        return collection;
      }, []);

      // 処理するノードの数をカウント
      const totalNodes = textNodes.length;
      let processedNodes = 0;

      // フォント設定を"env"に基づいて取得
      const styleKey = msg.fontSettings.env; // clientStorageから取得するためのキー
      
      const savedStyles = await figma.clientStorage.getAsync(styleKey) || {};
    
      // ここでcustomFontsToLoadを作成します
      const customFontsToLoad: FontName[] = (Object.values(savedStyles) as SavedFontSettings[]).flatMap(style => [
        style.Japanese, // 保存されている日本のフォント設定
        style.English   // 保存されている英語のフォント設定
      ]);
      
      // // Mac用のフォント設定
      // const fontsToLoadMac = [
      //   { family: "Noto Sans", style: "Regular" },
      //   { family: "SF Pro", style: "Semibold" }
      // ];
  
      // // Windows用のフォント設定
      // const fontsToLoadWindows = [
      //   // Windows用のフォント設定
      //   { family: "Meiryo", style: "Regular" },
      //   { family: "Yu Gothic", style: "Bold" }
      // ];
  
      // マージされたフォント設定に基づいてフォントをロードします
      const fontsToLoad = [...customFontsToLoad];
      
      for (const font of fontsToLoad) {
        // フォントのオブジェクトが正しくフォーマットされているか確認します
        if (font && font.family && font.style) {
          await figma.loadFontAsync(font);
        }
      }
      
      // fontSettingsの取得
      const fontSettings: SavedFontSettings | undefined = savedStyles[msg.styleName];
      
      if (!fontSettings || !fontSettings.Japanese || !fontSettings.English) {
        throw new Error('The font settings are missing or invalid.');
      }
  
      for (const textNode of textNodes) {
        await processTextNodes(textNode, fontSettings);

        // 処理されたノードの数をインクリメント
        processedNodes++;

        // 進捗率を計算してUIに送信
        const progress = (processedNodes / totalNodes) * 100;
        figma.ui.postMessage({ type: 'update-progress', progress: progress });
      }
  
      // ローディングを非表示にする
      figma.ui.postMessage({ type: 'hide-loading' });
      
    } catch (error) {
      // エラーをコンソールに出力
      console.error("Error processing text nodes:", error);
    }  finally {
      // ローディングを非表示にする
      figma.ui.postMessage({ type: 'hide-loading' });
    }
  } 
  // メッセージ受信ハンドラ
  else if (msg.type === 'load-fonts-request') {
    const fonts = await figma.listAvailableFontsAsync();
    figma.ui.postMessage({ type: 'load-fonts', fonts });
  }
  else if (msg.type === 'save-style') {
    const { styleName, fontSettings, key } = msg;
    
    // スタイルを保存して完了を待ちます
    await saveStyleForUser(styleName, fontSettings, key);
    // `style-${env}` 形式のキーを使用して、clientStorage から全てのスタイル情報を取得します。
    const styleKeyForVerification = `style-${key}`;

    figma.ui.postMessage({
      type: 'add-style-to-list',
      styleName: styleName,
      env: styleKeyForVerification
    });
  }
  else if (msg.type === 'delete-style') {
    deleteStyleForUser(msg.styleName, msg.env);
  }
}

// 具体的なフォント設定の型を定義する
interface SavedFontSettings {
  Japanese: FontName;
  English: FontName;
}

async function saveStyleForUser(styleName: string, fontSettings:{ Japanese: FontName, English: FontName }, env: string) {
  // ここでenvの値を一意なキーとして使用します
  const styleKey = `style-${env}`;
  let savedStyles = await figma.clientStorage.getAsync(styleKey) || {};
  savedStyles[styleName] = fontSettings; // 新しいスタイルを追加
  await figma.clientStorage.setAsync(styleKey, savedStyles);

  // 保存されているスタイルキーのリストを更新
  const savedStyleKeys = await figma.clientStorage.getAsync('savedStyleKeys') || [];
  if (!savedStyleKeys.includes(env)) {
    savedStyleKeys.push(env);
    await figma.clientStorage.setAsync('savedStyleKeys', savedStyleKeys);
  }
}

// テキストノード処理ロジックを関数化
async function processTextNodes(textNode: TextNode, fontSettings: {Japanese: FontName, English: FontName}) {
  // テキストノードに既に設定されているフォントをロード
  if (textNode.fontName !== figma.mixed) {
    await figma.loadFontAsync(textNode.fontName as FontName);    
  }

  const characters = textNode.characters;

  for (const segment of textNode.getStyledTextSegments(['fontName', 'fontWeight'])) {
    const { start, end } = segment;
    const textSegment = characters.slice(start, end);

    let fontName: FontName;

    // 日本語文字判定
    if (/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(textSegment)) {
      fontName = fontSettings.Japanese;
    }
    // 英数字（および記号）判定 - 日本語以外をデフォルトでここで処理する
    else {
      fontName = fontSettings.English;
    }
    
    for (let i = start; i < end; i++) {
      await figma.loadFontAsync(fontName);
      textNode.setRangeFontName(i, i + 1, fontName);
    }
  }
}

async function deleteStyleForUser(styleName: string, env: string) {
  const styleKey = `style-${env}`;
  
  let savedStyles = await figma.clientStorage.getAsync(styleKey) || {};
  if (savedStyles.hasOwnProperty(styleName)) {
    // スタイルを削除
    delete savedStyles[styleName];
    await figma.clientStorage.setAsync(styleKey, savedStyles);

    // 更新されたスタイルをUIに再送信（オプション）
    loadAndSendStyles();
  }
}
// figma.closePlugin();