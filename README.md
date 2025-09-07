# CS2200 Assembly IntelliSense

🚀 A lightweight Visual Studio Code extension that provides **IntelliSense support** for the LC2200 Assembly Language used in Georgia Tech’s Systems & Architecture (CS 2200) course.

This extension helps students by offering **autocomplete, syntax highlighting, and instruction details** for LC2200 assembly programs.

---

## ✨ Features

- ✅ Autocomplete suggestions for LC2200 assembly instructions (`add`, `lea`, `jalr`, etc.)
- ✅ Inline documentation for each instruction (operand format, usage)
- ✅ Syntax highlighting for `.s` / `.asm` files
- ✅ Easy setup—just install the extension and start coding!
- ✅ Label checking for `beq`, `lea` and `jmp`.
- ✅ Register name checking for all instructions.

Example: typing `ad` will suggest `add` along with its operand format:

---

## 📝 Usage

- Create or open a file with extension .s or .asm.
- Ensure to select the language `cs2200asm` at the bottom bar.
- Search for commands using `Ctrl+Shift+P` or `Cmd+Shift+P` and type `cs2200`.
  - Select the option `CS2200 ASM: Select ISA File` to select the `*.isa` file in the `isa` folder.
  - For general development, you can use the default isa that contains all the basic commands like `add`, `nand`, `addi`, `lw`, `sw`, `beq`, `jalr`, `halt`, and `lea`.
- Start typing an instruction (e.g., `lw`, `sw`, `add`) and IntelliSense will suggest completions.
- Hover over an instruction to see its expected operands.
- Errors related to register names and labels not existing are also highlighted!
- This is an example of what autocomplete adds:
  ![LC2200 Assembly Intellisense Example](images/image.png)

---

## 👨‍💻 Author

Developed by Laksh Makhija

---

## 💡 Contributions

This extension is very new so if you find any bugs or errors, feel free to post on Ed!
