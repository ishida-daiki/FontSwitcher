figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'analyzeAndUpdateText') {
    const nodes = figma.currentPage.findAll(node => node.type === 'TEXT') as TextNode[];

    for (const textNode of nodes) {
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
      const updatedTextSegments = [];

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