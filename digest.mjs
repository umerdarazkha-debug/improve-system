#!/usr/bin/env node
// Turns Claude Code session files (~/.claude/projects/*/*.jsonl) into a compact
// digest for the improve-system skill: what you asked, when, and which tools and
// skills ran. Reads local files only; makes no network calls.
//
// Usage: node digest.mjs [--days 30] [--max-chars 600] [--out file.md]

import fs from "fs";
import path from "path";
import os from "os";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const DAYS = Number(opt("days", 30));
const MAX = Number(opt("max-chars", 600));
const OUT = opt("out", null);
const ROOT = path.join(os.homedir(), ".claude", "projects");
const since = Date.now() - DAYS * 864e5;

// Text that the harness injects into user turns, not typed by the person.
const NOISE = /^(<system-reminder>|<command-|<local-command|<task-notification|<side-sessions-event|<ci-monitor-event|<scheduled-task|<agent-message|Caveat:|\[Request interrupted|\[SYSTEM NOTIFICATION|Another Claude session sent a message|Base directory for this skill|Task \(from the session|This session is being continued from a previous conversation|## Page contract)/;
// Notes the harness adds next to attached images.
const IMAGE_NOTE = /\[Image:[^\]]*\]/g;

const clean = (s) =>
  s
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<bash-(stdout|stderr)>[\s\S]*?<\/bash-(stdout|stderr)>/g, "")
    .replace(/<pasted_content[\s\S]*?<\/pasted_content[^>]*>/g, "[pasted]")
    .replace(IMAGE_NOTE, "")
    .replace(/\s+/g, " ")
    .trim();

function humanText(msg) {
  const c = msg?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    if (c.some((b) => b.type === "tool_result")) return "";
    return c.filter((b) => b.type === "text").map((b) => b.text).join(" ");
  }
  return "";
}

const sessions = [];
for (const proj of fs.existsSync(ROOT) ? fs.readdirSync(ROOT) : []) {
  const dir = path.join(ROOT, proj);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".jsonl")) continue;
    const file = path.join(dir, f);
    if (fs.statSync(file).mtimeMs < since) continue;
    let title = "", first = null, last = null, cwd = "";
    const prompts = [], tools = {}, skills = {};
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line) continue;
      let l;
      try { l = JSON.parse(line); } catch { continue; }
      if (l.type === "custom-title" && l.customTitle) title = l.customTitle;
      if (l.isSidechain) continue;
      if (l.timestamp) {
        const t = Date.parse(l.timestamp);
        first = first ?? t;
        last = t;
      }
      if (l.cwd) cwd = l.cwd;
      if (l.type === "user") {
        const t = clean(humanText(l.message));
        if (t && !NOISE.test(t)) prompts.push({ at: l.timestamp, shell: t.startsWith("<bash-input>"), text: t.slice(0, MAX) });
      }
      if (l.type === "assistant" && Array.isArray(l.message?.content)) {
        for (const b of l.message.content) {
          if (b.type !== "tool_use") continue;
          const name = b.name.startsWith("mcp__") ? b.name.split("__").slice(0, 2).join("__") : b.name;
          tools[name] = (tools[name] || 0) + 1;
          if (b.name === "Skill" && b.input?.skill) skills[b.input.skill] = (skills[b.input.skill] || 0) + 1;
        }
      }
    }
    if (prompts.length) sessions.push({ id: f.slice(0, 8), title, cwd, first, last, prompts, tools, skills });
  }
}

sessions.sort((a, b) => a.first - b.first);
const day = (t) => new Date(t).toISOString().slice(0, 10);
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(", ");

const allTools = {}, allSkills = {};
for (const s of sessions) {
  for (const [k, v] of Object.entries(s.tools)) allTools[k] = (allTools[k] || 0) + v;
  for (const [k, v] of Object.entries(s.skills)) allSkills[k] = (allSkills[k] || 0) + v;
}

let md = `# Session digest (last ${DAYS} days)\n\n`;
const typedN = sessions.reduce((n, s) => n + s.prompts.filter((p) => !p.shell).length, 0);
const shellN = sessions.reduce((n, s) => n + s.prompts.filter((p) => p.shell).length, 0);
md += `${sessions.length} sessions, ${typedN} typed messages, ${shellN} shell commands. Times are UTC.\n`;
md += `Top tools: ${top(allTools, 15) || "none"}\nSkills used: ${top(allSkills, 30) || "none"}\n\n`;
for (const s of sessions) {
  const mins = Math.round((s.last - s.first) / 6e4);
  md += `## ${day(s.first)} · ${s.title || "(untitled)"} · ${s.id} · ${mins} min\n`;
  md += `cwd: ${s.cwd}\ntools: ${top(s.tools, 8)}\n`;
  if (Object.keys(s.skills).length) md += `skills: ${top(s.skills, 8)}\n`;
  for (const p of s.prompts) md += `- [${p.at ? p.at.slice(5, 16).replace("T", " ") : ""}] ${p.text}\n`;
  md += "\n";
}

if (OUT) {
  fs.writeFileSync(OUT, md);
  console.log(`Wrote ${OUT} (${sessions.length} sessions, ${md.length} chars)`);
} else {
  process.stdout.write(md);
}
