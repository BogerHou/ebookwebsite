import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { createRequire } from "node:module";
import { publicCopyIssues } from "./public-copy-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/babel/parser");
const internalConfigFiles = new Set(["app/layout.tsx", "lib/site.ts"]);
const failures = [];
let checkedStrings = 0;
let sourceFiles = 0;

function inspect(text, location) {
  if (!text.trim()) return;
  checkedStrings++;
  for (const issue of publicCopyIssues(text)) failures.push({ location, ...issue });
}

function inspectData(value, location, notes = false) {
  if (typeof value === "string") { inspect(value, location); return; }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectData(item, `${location}[${index}]`, notes));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      // This is the only internal editorial string excluded from reader copy.
      // It must also stay absent from the rendered page and client data.
      if (notes && key === "evidenceLabel") continue;
      inspectData(item, `${location}.${key}`, notes);
    }
  }
}

async function filesIn(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) files.push(...await filesIn(path));
    else if (/\.(?:ts|tsx)$/.test(item.name)) files.push(path);
  }
  return files;
}

function inspectNode(node, file) {
  if (!node || typeof node !== "object") return;
  // Only these reviewed configuration errors are suppressed by the generic
  // error page. Other exceptions may reach a public error message and are scanned.
  if (node.type === "ThrowStatement" && internalConfigFiles.has(relative(root, file))) return;
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && node.callee.object.name === "console") return;
  const location = `${relative(root, file)}:${node.loc?.start.line || 1}`;
  if (node.type === "StringLiteral" || node.type === "JSXText") inspect(node.value, location);
  if (node.type === "TemplateLiteral") {
    inspect(node.quasis.map((part) => part.value.cooked ?? part.value.raw).join("${…}"), location);
  }
  for (const [key, child] of Object.entries(node)) {
    if (["loc", "extra", "comments", "leadingComments", "trailingComments", "innerComments"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((item) => inspectNode(item, file));
    else if (child && typeof child === "object" && typeof child.type === "string") inspectNode(child, file);
  }
}

for (const name of ["catalog", "book-details", "book-notes", "editorial"]) {
  const file = `data/${name}.json`;
  inspectData(JSON.parse(await readFile(join(root, file), "utf8")), file, name === "book-notes");
}
for (const directory of ["app", "components", "lib"]) {
  for (const file of await filesIn(join(root, directory))) {
    sourceFiles++;
    const tree = parse(await readFile(file, "utf8"), { sourceType: "module", plugins: ["typescript", "jsx"] });
    inspectNode(tree, file);
  }
}
console.log(JSON.stringify({ sourceFiles, checkedStrings, failures }, null, 2));
if (failures.length) process.exitCode = 1;
