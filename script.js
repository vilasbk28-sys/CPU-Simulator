const defaultProgram = `LOAD R1, 10
LOAD R2, 5
ADD R1, R2
STORE R1, 20
SUB R1, 2
AND R1, R2
OR R1, R2
XOR R1, R2`;

const cpu = {
  registers: { R1: 0, R2: 0, R3: 0, R4: 0, PC: 0, IR: "-" },
  dataMemory: {},
  program: [],
  current: 0,
  stage: 0,
  running: false
};

const stages = ["FETCH", "DECODE", "EXECUTE", "MEMORY", "WRITE BACK"];

function parseProgram() {
  cpu.program = document.getElementById("programInput").value
    .split("\n").map(x => x.trim()).filter(Boolean);
}

function renderRegisters() {
  const box = document.getElementById("registers");
  box.innerHTML = "";
  Object.entries(cpu.registers).forEach(([name, value]) => {
    box.innerHTML += `<div class="register"><span>${name}</span><strong>${value}</strong></div>`;
  });
}

function renderMemory() {
  const table = document.getElementById("memoryTable");
  table.innerHTML = "";
  cpu.program.forEach((instruction, i) => {
    table.innerHTML += `<tr class="${i === cpu.current && cpu.stage > 0 ? "memory-active" : ""}">
      <td>${i}</td><td>${instruction}</td></tr>`;
  });
  Object.entries(cpu.dataMemory).forEach(([address, value]) => {
    table.innerHTML += `<tr><td>${address}</td><td>DATA: ${value}</td></tr>`;
  });
}

function log(message) {
  const logBox = document.getElementById("log");
  const entry = document.createElement("div");
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logBox.prepend(entry);
}

function clearHighlights() {
  document.querySelectorAll(".data-unit").forEach(e => e.classList.remove("active"));
}

function renderStages() {
  const nodes = document.querySelectorAll(".stage");
  nodes.forEach((node, i) => {
    node.classList.remove("active", "done");
    if (cpu.stage > i + 1) node.classList.add("done");
    if (cpu.stage === i + 1) node.classList.add("active");
  });
}

function getOperands(instruction) {
  const parts = instruction.replace(/,/g, " ").trim().split(/\s+/);
  return { op: parts[0].toUpperCase(), a: parts[1]?.toUpperCase(), b: parts[2]?.toUpperCase() };
}

function valueOf(x) {
  if (Object.prototype.hasOwnProperty.call(cpu.registers, x)) return Number(cpu.registers[x]);
  const value = Number(x);
  if (Number.isNaN(value)) throw new Error(`Invalid value: ${x}`);
  return value;
}

function executeInstruction(instruction) {
  const { op, a, b } = getOperands(instruction);
  if (!a) throw new Error("Missing operand.");

  switch(op) {
    case "LOAD":
      if (!(a in cpu.registers)) throw new Error("Invalid register.");
      cpu.registers[a] = valueOf(b);
      log(`LOAD: ${a} ← ${cpu.registers[a]}`);
      break;
    case "STORE":
      cpu.dataMemory[b] = valueOf(a);
      log(`STORE: Memory[${b}] ← ${cpu.dataMemory[b]}`);
      break;
    case "ADD":
      cpu.registers[a] = valueOf(a) + valueOf(b);
      log(`ALU ADD: ${a} ← ${cpu.registers[a]}`);
      break;
    case "SUB":
      cpu.registers[a] = valueOf(a) - valueOf(b);
      log(`ALU SUB: ${a} ← ${cpu.registers[a]}`);
      break;
    case "AND":
      cpu.registers[a] = valueOf(a) & valueOf(b);
      log(`ALU AND: ${a} ← ${cpu.registers[a]}`);
      break;
    case "OR":
      cpu.registers[a] = valueOf(a) | valueOf(b);
      log(`ALU OR: ${a} ← ${cpu.registers[a]}`);
      break;
    case "XOR":
      cpu.registers[a] = valueOf(a) ^ valueOf(b);
      log(`ALU XOR: ${a} ← ${cpu.registers[a]}`);
      break;
    default:
      throw new Error(`Unsupported instruction: ${op}`);
  }
}

function updateUI(message = "") {
  renderRegisters();
  renderMemory();
  renderStages();
  document.getElementById("cycleMessage").textContent = message;
}

function stepCPU() {
  if (cpu.current >= cpu.program.length) {
    clearHighlights();
    document.getElementById("currentInstruction").textContent = "Program completed";
    updateUI("All instructions have been executed successfully.");
    return false;
  }

  const instruction = cpu.program[cpu.current];
  cpu.stage++;
  cpu.registers.PC = cpu.current;
  document.getElementById("currentInstruction").textContent = instruction;
  clearHighlights();

  try {
    if (cpu.stage === 1) {
      cpu.registers.IR = instruction;
      document.getElementById("memoryUnit").classList.add("active");
      log(`FETCH: Instruction fetched from address ${cpu.current}.`);
      updateUI("FETCH: The instruction is fetched from program memory.");
    } else if (cpu.stage === 2) {
      document.getElementById("controlUnit").classList.add("active");
      log(`DECODE: Control Unit decoded "${instruction}".`);
      updateUI("DECODE: The Control Unit identifies the operation and operands.");
    } else if (cpu.stage === 3) {
      document.getElementById("aluUnit").classList.add("active");
      log("EXECUTE: CPU is performing the required operation.");
      updateUI("EXECUTE: The ALU/CPU performs the instruction.");
    } else if (cpu.stage === 4) {
      document.getElementById("memoryUnit").classList.add("active");
      log("MEMORY ACCESS: Memory is checked or updated if required.");
      updateUI("MEMORY: The CPU performs memory access when needed.");
    } else if (cpu.stage === 5) {
      executeInstruction(instruction);
      document.getElementById("registerUnit").classList.add("active");
      updateUI("WRITE BACK: The result has been stored. Moving to the next instruction.");
      cpu.current++;
      cpu.stage = 0;
      cpu.registers.PC = cpu.current;
    }
  } catch (error) {
    log(`ERROR: ${error.message}`);
    updateUI(`Error: ${error.message}`);
    cpu.current++;
    cpu.stage = 0;
  }
  return true;
}

function resetCPU() {
  cpu.registers = { R1: 0, R2: 0, R3: 0, R4: 0, PC: 0, IR: "-" };
  cpu.dataMemory = {};
  cpu.current = 0;
  cpu.stage = 0;
  parseProgram();
  document.getElementById("currentInstruction").textContent = "No instruction loaded";
  document.getElementById("log").innerHTML = "";
  clearHighlights();
  updateUI("CPU has been reset and is ready.");
  log("CPU RESET.");
}

document.getElementById("stepBtn").addEventListener("click", () => {
  if (cpu.stage === 0 && cpu.current === 0) parseProgram();
  stepCPU();
});

document.getElementById("resetBtn").addEventListener("click", resetCPU);

document.getElementById("loadExample").addEventListener("click", () => {
  document.getElementById("programInput").value = defaultProgram;
  resetCPU();
});

document.getElementById("runBtn").addEventListener("click", async () => {
  if (cpu.running) return;
  if (cpu.stage === 0 && cpu.current === 0) parseProgram();
  cpu.running = true;
  document.getElementById("runBtn").textContent = "Running...";
  while (cpu.current < cpu.program.length) {
    stepCPU();
    await new Promise(resolve => setTimeout(resolve, 450));
  }
  cpu.running = false;
  document.getElementById("runBtn").textContent = "Run All";
  stepCPU();
});

resetCPU();
