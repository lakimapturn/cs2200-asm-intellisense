const { loadIsaSpecs } = require("./isaParser");
const vscode = require("vscode");
const path = require("path");

// Default hardcoded instruction specifications
const defaultInstructionSpecs = {
  add: ["register", "register", "register"],
  nand: ["register", "register", "register"],
  addi: ["register", "register", "number"],
  lw: ["register", "number(register)"],
  sw: ["register", "number(register)"],
  beq: ["register", "register", "label"],
  lea: ["register", "label"],
  jalr: ["register", "register"],
  halt: [],
};

// @ts-ignore
const legalMnemonics = new Set([
  "add",
  "nand",
  "addi",
  "lw",
  "sw",
  "beq",
  "jalr",
  "halt",
  "bgt",
  "lea",
]);

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

// Allowed pseudo ops
const pseudoOps = new Set([".word", ".fill"]);

let currentInstructionSpecs = defaultInstructionSpecs;

function loadInstructionSpecs() {
  const config = vscode.workspace.getConfiguration("cs2200asm");
  const isaFilePath = config.get("isaFilePath");

  if (isaFilePath && isaFilePath.trim() !== "") {
    try {
      // If it's a relative path, resolve it relative to workspace
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const resolvedPath = path.isAbsolute(isaFilePath)
        ? isaFilePath
        : path.join(workspaceRoot || "", isaFilePath);

      const customSpecs = loadIsaSpecs(
        path.dirname(resolvedPath),
        path.basename(resolvedPath)
      );
      if (Object.keys(customSpecs).length > 0) {
        // @ts-ignore
        currentInstructionSpecs = customSpecs;
        vscode.window.showInformationMessage(
          `Loaded ISA specs from: ${isaFilePath}`
        );
        console.log(
          "Loaded custom instruction specs:",
          currentInstructionSpecs
        );
        return;
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to load ISA file: ${error.message}`
      );
    }
  }

  // Fall back to default specs
  currentInstructionSpecs = defaultInstructionSpecs;
  console.log("Using default instruction specs:", currentInstructionSpecs);
}

function activate(context) {
  // Load instruction specs on activation
  loadInstructionSpecs();

  // Register command to select ISA file
  const selectIsaFileCommand = vscode.commands.registerCommand(
    "cs2200asm.selectIsaFile",
    async () => {
      const options = {
        canSelectMany: false,
        openLabel: "Select ISA File",
        filters: {
          "ISA Files": ["isa"],
          "All Files": ["*"],
        },
      };

      const fileUri = await vscode.window.showOpenDialog(options);
      if (fileUri && fileUri[0]) {
        const workspaceRoot =
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        let relativePath = fileUri[0].fsPath;

        // Convert to relative path if possible
        if (workspaceRoot && relativePath.startsWith(workspaceRoot)) {
          relativePath = path.relative(workspaceRoot, relativePath);
        }

        const config = vscode.workspace.getConfiguration("cs2200asm");
        await config.update(
          "isaFilePath",
          relativePath,
          vscode.ConfigurationTarget.Workspace
        );

        // Reload specs
        loadInstructionSpecs();

        // Refresh diagnostics for all open documents
        const diagnosticCollection = context.subscriptions.find(
          (sub) =>
            // @ts-ignore
            sub instanceof vscode.DiagnosticCollection ||
            (sub && typeof sub.set === "function")
        );
        if (diagnosticCollection) {
          vscode.workspace.textDocuments.forEach((doc) => {
            if (doc.languageId === "cs2200asm") {
              validateDocument(doc, diagnosticCollection);
            }
          });
        }
      }
    }
  );

  // Watch for configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("cs2200asm.isaFilePath")) {
        loadInstructionSpecs();

        // Refresh diagnostics for all open documents
        const diagnosticCollection = context.subscriptions.find(
          (sub) =>
            // @ts-ignore
            sub instanceof vscode.DiagnosticCollection ||
            (sub && typeof sub.set === "function")
        );
        if (diagnosticCollection) {
          vscode.workspace.textDocuments.forEach((doc) => {
            if (doc.languageId === "cs2200asm") {
              validateDocument(doc, diagnosticCollection);
            }
          });
        }
      }
    }
  );

  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: "file", language: "cs2200asm" },
    {
      // @ts-ignore
      provideCompletionItems(document, position) {
        const completions = [];

        // Generate completions based on current instruction specs
        Object.keys(currentInstructionSpecs).forEach((mnemonic) => {
          const operands = currentInstructionSpecs[mnemonic];
          let insertText = mnemonic;
          let detail =
            operands.length === 0 ? "no operands" : operands.join(", ");

          // Create more helpful snippet text
          if (operands.length > 0) {
            const placeholders = operands.map((type, index) => {
              switch (type) {
                case "register":
                  return `$\{${index + 1}:$t0}`;
                case "number":
                  return `\{${index + 1}:0}`;
                case "label":
                  return `\{${index + 1}:label}`;
                case "number(register)":
                  return `\{${index + 1}:0($t0)}`;
                default:
                  return `\{${index + 1}:${type}}`;
              }
            });
            insertText = `${mnemonic} ${placeholders.join(", ")}`;
          }

          completions.push(makeSnippet(mnemonic, insertText, detail));
        });

        return completions;
      },
    }
  );

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cs2200asm");
  context.subscriptions.push(diagnosticCollection);
  context.subscriptions.push(selectIsaFileCommand);
  context.subscriptions.push(configChangeListener);

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
    // Strip out comments
    let codePart = line.split("!")[0].trim();
    if (!codePart) return; // empty or comment-only line

    // Handle label definitions
    if (codePart.includes(":")) {
      const afterLabel = codePart.split(":")[1].trim();
      if (!afterLabel) return;
      codePart = afterLabel;
    }

    // Turn commas into spaces so we dont need to worry about spacing between regs
    codePart = codePart.replace(/,/g, " ");
    const tokens = codePart.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return;

    const mnemonic = tokens[0];

    // Check against current instruction specs (which may be custom or default)
    const currentMnemonics = new Set([
      ...Object.keys(currentInstructionSpecs),
      ...pseudoOps,
    ]);

    // Illegal mnemonic check
    if (!currentMnemonics.has(mnemonic)) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(
            i,
            line.indexOf(mnemonic),
            i,
            line.indexOf(mnemonic) + mnemonic.length
          ),
          `Illegal mnemonic: ${mnemonic}`,
          vscode.DiagnosticSeverity.Error
        )
      );
      return;
    }

    // Checking instruction specs
    const operands = tokens.slice(1);
    if (currentInstructionSpecs[mnemonic]) {
      const expected = currentInstructionSpecs[mnemonic];

      // Operand count mismatch
      if (operands.length !== expected.length) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(
              i,
              line.indexOf(mnemonic),
              i,
              line.indexOf(mnemonic) + mnemonic.length
            ),
            `Expected ${expected.length} operand(s) for '${mnemonic}', got ${operands.length}`,
            vscode.DiagnosticSeverity.Error
          )
        );
      } else {
        // Operand type validation
        operands.forEach((op, idx) => {
          const type = expected[idx];
          const cleanOp = op.replace(/[()]/g, ""); // handle offset($reg)

          if (type === "register" && !validRegisters.has(cleanOp)) {
            diagnostics.push(
              new vscode.Diagnostic(
                new vscode.Range(
                  i,
                  line.indexOf(op),
                  i,
                  line.indexOf(op) + op.length
                ),
                `Expected register at position ${idx + 1}, got '${op}'`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }

          if (type === "number" && isNaN(parseInt(op))) {
            diagnostics.push(
              new vscode.Diagnostic(
                new vscode.Range(
                  i,
                  line.indexOf(op),
                  i,
                  line.indexOf(op) + op.length
                ),
                `Expected number at position ${idx + 1}, got '${op}'`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }

          if (type === "label" && !labels.has(op)) {
            diagnostics.push(
              new vscode.Diagnostic(
                new vscode.Range(
                  i,
                  line.indexOf(op),
                  i,
                  line.indexOf(op) + op.length
                ),
                `Expected label at position ${idx + 1}, got '${op}'`,
                vscode.DiagnosticSeverity.Warning
              )
            );
          }

          if (type === "number(register)") {
            // Match like 4($t0) or -12($s1)
            const match = op.match(/^(-?\d+)\((\$[a-z0-9]+)\)$/i);
            if (!match || !validRegisters.has(match[2])) {
              diagnostics.push(
                new vscode.Diagnostic(
                  new vscode.Range(
                    i,
                    line.indexOf(op),
                    i,
                    line.indexOf(op) + op.length
                  ),
                  `Expected number(register) format at position ${
                    idx + 1
                  }, got '${op}'`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
        });
      }
    }

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

    // Label usage validation
    if (/^(beq|bgt|lea|jalr|jmp)\b/.test(mnemonic)) {
      const label = tokens[tokens.length - 1].replace(/[,]/g, "");
      if (
        label &&
        !labels.has(label) &&
        !label.startsWith("$") &&
        isNaN(label)
      ) {
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
  item.insertText = new vscode.SnippetString(insertText);
  item.detail = detail;
  return item;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
