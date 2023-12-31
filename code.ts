figma.showUI(__html__, {themeColors: true, height: 500, width: 400});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'analyzeAndUpdateText') {
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

    for (const textNode of textNodes) {
      // テキストノードに既に設定されているフォントをロード
      if (textNode.fontName !== figma.mixed) {
        await figma.loadFontAsync(textNode.fontName as FontName);
      }

      // ここで予め必要なフォントをロードしておきます
      await figma.loadFontAsync({ family: "Noto Sans", style: "Regular" });
      await figma.loadFontAsync({ family: "Helvetica", style: "Regular" });
      // "SF Pro"のフォントウェイトが「Bold」なのか「Semibold」なのかなど、実際のプロジェクトで利用しているフォントウェイトに合わせて変更する
      await figma.loadFontAsync({ family: "SF Pro", style: "Semibold" });

      const characters = textNode.characters;

      for (const segment of textNode.getStyledTextSegments(['fontName', 'fontWeight'])) {
        const { start, end } = segment;
        const textSegment = characters.slice(start, end);
        
        let fontName: FontName;

        // 日本語文字判定
        if (/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/.test(textSegment)) {
          fontName = { family: "Noto Sans", style: "Regular" };
        }
        // 英語文字判定
        else if (/[a-zA-Z]/.test(textSegment)) {
          fontName = { family: "SF Pro Text", style: "Semibold" };
        }
        // 数字判定
        else if (/\d/.test(textSegment)) {
          fontName = { family: "Helvetica", style: "Regular" };
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
    
    figma.closePlugin();
  }
};