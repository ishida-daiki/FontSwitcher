Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.


BEM (Block Element Modifier) 命名規則の採用
ブロック (Block)
•コンポーネントのルートとなる要素。
•複数の単語がある場合はケバブケース（例：first-name）を使用。
•以下のように命名： .block-name

エレメント (Element)
•ブロックの一部で子要素として存在する。
•ブロック名に続けてダブルアンダースコア __ を使用。
•以下のように命名： .block-name__element-name

モディファイア (Modifier)
•ブロックやエレメントのスタイルを変更したい場合に使用。
•ブロックまたはエレメント名に続けてダブルハイフン -- を使用。
•以下のように命名： .block-name--modifier-name または .block-name__element-name--modifier-name

クラス名の命名規則
•すべてのクラス名は、その機能や意味がわかりやすいものにする。
•クラス名は単一責任原則に基づいて設計し、1つのクラスには1つの明確な目的があること。
•状態を表すクラス（例：活性/非活性）はモディファイアを用いて明確に区別する。
•影響範囲が広いスタイル（例： margin、padding）は慎重に使用し、どの要素に適用されても安全な汎用的なクラスにする。
•コンポーネントのスタイルはコンポーネントごとにファイルを分けて記述し（カプセル化）、スコープを限定すること。
•JavaScriptでの操作対象となるクラスは接頭辞 js- を付けて区別（例： .js-toggle-button）。

一般的なベストプラクティス
•セレクタの深さは、メンテナンス性を考慮して3層以上を避ける。
•!important の使用を避け、代わりに適切なカスケーディングや特異性を利用。
•スタイルのルールセット間に一行の改行を入れ、可読性を向上。
•カラー値、影、ボーダー半径などはカスタムプロパティ（CSS変数）を使用し、一か所で管理。
•メディアクエリ、状態、およびその他の疑似クラスは、関連するセレクタに近い場所に配置。
このガイドラインは、新しい開発メンバーが既存のコードベースに迅速に適応し、一貫性を維持しつつ、クリーンなコードを書くのに役立ちます。また、設計書やドキュメントとしても利用でき、チームメンバー間でのコミュニケーションをサポートする基準となるでしょう。