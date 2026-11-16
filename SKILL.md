---
name: improve-system
description: Read back through your past Claude Code sessions and improve your setup from them. Finds where Claude kept getting things wrong, what you had to explain twice, and jobs you keep doing by hand; then proposes CLAUDE.md rules, memories, new skills (written for you on approval) and automations. Local only, no account. Use when someone says "improve your system", "improve yourself", "review my sessions", "what skills should I build", "self-improve", "audit my setup" or "recap my week".
---

# /improve-system

A free, local take on BuildPartner's `improve-system`. Everything stays on this machine: it reads `~/.claude/projects/*/*.jsonl` and setup files, sends nothing anywhere, and changes nothing until the user says yes. Tip for the user: Claude Code's built-in `/insights` gives a complementary HTML usage report; this skill goes further by writing the fixes.

## Step 1: Build the digest

```bash
node ~/.claude/skills/improve-system/digest.mjs --days 30 --out "$SCRATCH/digest.md"
```

Use the session scratchpad (or a temp dir) for `$SCRATCH`. Read the whole digest. If it is over ~150k characters, rerun with `--days 14` or `--max-chars 300`. Arguments: `--days N` window, `--max-chars N` per prompt.

Also read what already exists so you don't suggest duplicates:
- `~/.claude/CLAUDE.md`, the project's `CLAUDE.md`, `~/.claude/settings.json`, `.claude/settings.json`
- `~/.claude/skills/*/SKILL.md` frontmatter and project `.claude/skills/`
- the auto-memory folder for this project (`MEMORY.md` + files), if there is one

## Step 2: Find patterns (only ones that recur)

Flag a pattern only when it shows up in 2+ sessions or 3+ times in one session. Quote the user's own words as evidence, with date and session id.

1. **Got wrong**: corrections ("no", "that's wrong", "not like that", "I said", "again", "why did you", frustration). What was Claude doing wrong, and what rule would have prevented it?
2. **Explained twice**: the same preference, fact, path, account, brand rule or context given in more than one session.
3. **Done by hand**: the same multi-step request repeated (same verbs, same tools, same shape of task) that a skill, script, hook or scheduled task could do.
4. **Skills you should already have**: for each repeated workflow, check whether an installed skill covers it. If one does but was never invoked, say so. If none does, propose a new skill.
5. **Friction**: permission prompts the user approves every time, tools that failed repeatedly, slow loops.

## Step 3: Report

Keep it to 10 items max, highest payoff first:

```
## Improve system — last {N} days, {projects}

### Where it's going wrong
1. {pattern} — "{quote}" ({date}, {id}) ×{count}
   Fix: {exact CLAUDE.md rule / memory text}

### Explained twice
...

### Skills you should already have
1. /{name} — {what it does}; replaces {the repeated request} ×{count}
   (or: you already have /{skill} for this, it was never used)

### Do this by hand every day? Automate it
1. {task} — {how: skill / hook / scheduled task / script}, saves ~{estimate, labelled as an estimate}

### What's working
- {2-3 things}
```

Never invent counts. Every number comes from the digest.

## Step 4: Apply on approval

Ask which items to apply. Then, one at a time:
- **Rules**: add to the right CLAUDE.md (global vs project) or save as a memory; show the exact text first.
- **New skills**: write `~/.claude/skills/<name>/SKILL.md` (use the `skill-creator` skill if it's installed) with a precise trigger description, steps taken from how the user actually did it, and the gotchas found in the sessions.
- **Automations**: propose hooks via the `update-config` skill or a scheduled task via `schedule`; never create one without a yes.

Never delete or rewrite existing rules or skills without explicit approval. Suggest re-running weekly.
