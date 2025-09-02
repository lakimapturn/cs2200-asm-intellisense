const vscode = require("vscode");

// instruction format
const instructionSpecs = {
  add: ["register", "register", "register"],
  nand: ["register", "register", "register"],
  addi: ["register", "register", "number"],
  lw: ["register", "number(register)"],
  sw: ["register", "number(register)"],
  beq: ["register", "register", "number"],
  lea: ["register", "label"],
  jalr: ["register", "register"],
  halt: [],
};

// Allowed registers
const validRegisters = new Set([
  "$zero",
  "$t0",
  "$t1",
  "$t2",
  "$s0",
  "$s1",
  "$s2",
  "$v0",
  "$ra",
  "$at",
  "$sp",
  "$fp",
  "$a0",
  "$a1",
  "$a2",
  "$k0",
]);

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
        completions.push(
          makeSnippet("lea", "lea DR, label", "register, label")
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

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cs2200asm");
  context.subscriptions.push(diagnosticCollection);

  vscode.workspace.onDidOpenTextDocument((doc) =>
    validateDocument(doc, diagnosticCollection)
  );
  vscode.workspace.onDidChangeTextDocument((event) =>
    validateDocument(event.document, diagnosticCollection)
  );

  context.subscriptions.push(provider);
}

function validateDocument(doc, diagnosticCollection) {
  if (doc.languageId !== "cs2200asm") return;

  const diagnostics = [];
  const text = doc.getText().split("\n");

  // Collect all labels (anything ending with :)
  const labels = new Set();
  text.forEach((line) => {
    const match = line.match(/^(\w+):/);
    if (match) {
      labels.add(match[1]);
    }
  });

  text.forEach((line, i) => {
    // Strip out comments first
    let codePart = line.split("!")[0].trim();
    if (!codePart) return; // whole line was a comment, skip

    codePart = line.replace(/[,]/g, " ");

    const tokens = codePart.split(/\s+/);

    // Register validation
    tokens.forEach((token) => {
      const cleanToken = token.trim();

      if (cleanToken.startsWith("$") && !validRegisters.has(cleanToken)) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(
              i,
              line.indexOf(token),
              i,
              line.indexOf(token) + token.length
            ),
            `Invalid register: ${cleanToken}`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    });

    // Label usage validation (e.g., "beq label", "lea DR, label")
    if (/^(beq|bne|jmp|lea)\b/.test(tokens[0])) {
      const label = tokens[tokens.length - 1].replace(/[,]/g, "");
      if (!labels.has(label)) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(
              i,
              line.indexOf(label),
              i,
              line.indexOf(label) + label.length
            ),
            `Undefined label: ${label}`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    }
  });

  diagnosticCollection.set(doc.uri, diagnostics);
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
