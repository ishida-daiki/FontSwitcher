figma.showUI(__html__, {themeColors: true, height: 400, width: 300});


// 選択した要素を変更したときに発生するイベント
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    // 何も選択されていない場合
    figma.ui.postMessage({ type: 'selection-cleared' });
  } else {
    for (const node of selection) {
      if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION' || node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'TEXT') {
        figma.ui.postMessage({ type: 'update-name', name: node.name });
      }
    }
  }
});


// Applyボタンを押下したときに発生するイベント
figma.ui.onmessage = async (msg) => {
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

      // Mac用のフォント設定
      const fontsToLoadMac = [
        { family: "Noto Sans", style: "Regular" },
        { family: "Helvetica", style: "Regular" },
        { family: "SF Pro", style: "Semibold" }
      ];

      // Windows用のフォント設定
      const fontsToLoadWindows = [
        // Windows用のフォント設定
        { family: "Meiryo", style: "Regular" },
        { family: "Arial", style: "Regular" },
        { family: "Yu Gothic", style: "Bold" }
      ];

      // MacとWindowsのフォントの設定をマージします
      const fontsToLoad = [...fontsToLoadMac, ...fontsToLoadWindows];

      // マージされたフォント設定に基づいてフォントをロードします
      for (const font of fontsToLoad) {
        await figma.loadFontAsync(font);
      }

      // 処理するノードの数をカウント
      const totalNodes = textNodes.length;
      let processedNodes = 0;
  
      for (const textNode of textNodes) {
        await processTextNodes(textNode, msg.fontSettings.env);

        // 処理されたノードの数をインクリメント
        processedNodes++;

        // 進捗率を計算してUIに送信
        const progress = (processedNodes / totalNodes) * 100;
        figma.ui.postMessage({ type: 'update-progress', progress: progress });
      }
  
      // ローディングを非表示にする
      figma.ui.postMessage({ type: 'hide-loading' });
      
      console.log("end");
    } catch (error) {
      // エラーをコンソールに出力
      console.error("Error processing text nodes:", error);
    }  finally {
      // ローディングを非表示にする
      figma.ui.postMessage({ type: 'hide-loading' });
    }
  }
}

// テキストノード処理ロジックを関数化
async function processTextNodes(textNode: TextNode, env: string) {
  // テキストノードに既に設定されているフォントをロード
  if (textNode.fontName !== figma.mixed) {
    await figma.loadFontAsync(textNode.fontName as FontName);
  }

  const characters = textNode.characters;

  for (const segment of textNode.getStyledTextSegments(['fontName', 'fontWeight'])) {
    const { start, end } = segment;
    const textSegment = characters.slice(start, end);
    console.log(textSegment);
    
    let fontName: FontName;

    // 日本語文字判定
    if (/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(textSegment)) {
      fontName = env === 'mac' ? { family: "Noto Sans", style: "Regular" } : fontName = { family: "Meiryo", style: "Regular" };
    }
    // 英語文字判定
    else if (/[a-zA-Z]/.test(textSegment)) {
      fontName = env === 'mac' ? { family: "SF Pro Text", style: "Semibold" } : { family: "Arial", style: "Regular" };
    }
    // 数字判定
    else if (/\d/.test(textSegment)) {
      fontName = env === 'mac' ? { family: "Helvetica", style: "Regular" } : { family: "Yu Gothic", style: "Bold" };
    }
    else {
      // それ以外の文文字の場合は変更を適用させない
      continue;
    }
    
    for (let i = start; i < end; i++) {
      await figma.loadFontAsync(fontName);
      textNode.setRangeFontName(i, i + 1, fontName);
    }
  }
}
// figma.closePlugin();
