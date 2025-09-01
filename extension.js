const vscode = require("vscode");

function activate(context) {
  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file", language: "cs2200asm" },
    {
      provideCompletionItems(document, position) {
        const completions = [];

        // --- R Type ---
        completions.push(
          makeSnippet("add", "add DR, SR1, SR2", "register, register, register")
        );
        completions.push(
          makeSnippet(
            "nand",
            "nand DR, SR1, SR2",
            "register, register, register"
          )
        );

        // --- I Type ---
        completions.push(
          makeSnippet(
            "addi",
            "addi DR, SR1, imm25",
            "register, register, number"
          )
        );
        completions.push(
          makeSnippet("lw", "lw DR, offset(SR)", "register, number(register)")
        );
        completions.push(
          makeSnippet("sw", "sw SR, offset(DR)", "register, number(register)")
        );
        completions.push(
          makeSnippet(
            "beq",
            "beq SR1, SR2, offset",
            "register, register, number"
          )
        );

        // --- J Type ---
        completions.push(
          makeSnippet("jalr", "jalr DR, SR", "register, register")
        );

        // --- O Type ---
        completions.push(makeSnippet("halt", "halt", "no operands"));

        return completions;
      },
    }
  );

  context.subscriptions.push(provider);
}

function makeSnippet(label, insertText, detail) {
  const item = new vscode.CompletionItem(
    label,
    vscode.CompletionItemKind.Keyword
  );
  item.insertText = insertText;
  item.detail = detail; // shows format (e.g., "register, register, number")
  return item;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
