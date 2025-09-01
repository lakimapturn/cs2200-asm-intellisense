const assert = require("assert");
const vscode = require("vscode");

suite("CS2200 Assembly IntelliSense Tests", () => {
  test("Extension activates", async () => {
    const ext = vscode.extensions.getExtension(
      "lakimapturn.cs2200-asm-intellisense"
    );
    assert.ok(ext, "Extension not found in VS Code.");

    await ext.activate();
    assert.ok(ext.isActive, "Extension failed to activate.");
  });

  //   test("Provides completion items for instructions", async () => {
  //     const doc = await vscode.workspace.openTextDocument({
  //       content: "ad",
  //       language: "cs2200asm",
  //     });
  //     const pos = new vscode.Position(0, 2); // after "ad"

  //     const completions = /** @type {vscode.CompletionList} */ (
  //       await vscode.commands.executeCommand(
  //         "vscode.executeCompletionItemProvider",
  //         doc.uri,
  //         pos
  //       )
  //     );

  //     console.log(
  //       "Completion labels:",
  //       completions.items.map((i) => i.label)
  //     );

  //     // Look for "add"
  //     const hasAdd = completions.items.some((item) => item.label === "add");
  //     assert.ok(hasAdd, 'Expected "add" to be suggested as completion.');
  //   });

  //   test("Provides correct detail for add instruction", async () => {
  //     const doc = await vscode.workspace.openTextDocument({
  //       content: "add",
  //       language: "cs2200asm",
  //     });
  //     const pos = new vscode.Position(0, 3);

  //     const completions = /** @type {vscode.CompletionList} */ (
  //       await vscode.commands.executeCommand(
  //         "vscode.executeCompletionItemProvider",
  //         doc.uri,
  //         pos
  //       )
  //     );

  //     console.log(
  //       "Completion labels:",
  //       completions.items.map((i) => i.label)
  //     );

  //     const addItem = completions.items.find((item) => item.label === "add");
  //     assert.ok(addItem, 'Expected "add" completion item.');
  //     assert.strictEqual(
  //       addItem.detail,
  //       "register, register, register",
  //       "Add instruction detail mismatch."
  //     );
  //   });
});
