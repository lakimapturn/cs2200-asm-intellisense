const fs = require("fs");
const path = require("path");

function parseOperands(operandSpec) {
  if (!operandSpec) return [];

  // Normalize escapes from .isa files
  let s = operandSpec.trim();
  s = s.replace(/\\s\*/g, "");
  s = s.replace(/\\\(/g, "(").replace(/\\\)/g, ")");
  s = s.replace(/\\/g, "");

  const operands = [];

  // Regex to capture operand tokens in order
  const tokenPattern = /#I\s*\(\s*\$[A-Za-z0-9]+\s*\)|\$[A-Za-z0-9]+|#I|%O/g;
  const matches = s.match(tokenPattern);
  if (!matches) return [];

  matches.forEach((tok) => {
    if (/^#I\s*\(\s*\$[A-Za-z0-9]+\s*\)$/.test(tok)) {
      operands.push("number(register)");
    } else if (/^\$[A-Za-z0-9]+$/.test(tok)) {
      operands.push("register");
    } else if (tok === "#I") {
      operands.push("number");
    } else if (tok === "%O") {
      operands.push("label");
    }
  });

  return operands;
}

function loadIsaSpecs(workspaceRoot, fileName = ".isa") {
  const isaPath = path.join(workspaceRoot, fileName);
  if (!fs.existsSync(isaPath)) return {};

  const isaContent = fs.readFileSync(isaPath, "utf-8");
  const specs = {};

  isaContent.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const [instrPart] = line.split(":");
    if (!instrPart) return;

    const tokens = instrPart.trim().split(/\s+/);
    const mnemonic = tokens[0];
    const operandSpec = instrPart.slice(mnemonic.length).trim();

    specs[mnemonic] = parseOperands(operandSpec);
  });

  return specs;
}

module.exports = { loadIsaSpecs };
