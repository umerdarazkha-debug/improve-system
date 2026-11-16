# improve-system

A free Claude Code skill that reads your past sessions and tells you how to fix your setup.

It finds three things:

1. **Where Claude keeps getting it wrong** and the exact rule that would have stopped it.
2. **What you explained twice** so you only explain it once.
3. **Jobs you still do by hand** that a skill, hook or scheduled task could do for you.

Then it writes the fixes for you, one at a time, only after you say yes.

The script runs on your machine and makes no network calls. No third-party service, no extra account, no API key. Claude reads the result inside your normal Claude Code session.

## Install

You need [Claude Code](https://claude.com/claude-code) and Node 18 or newer.

```bash
git clone https://github.com/umerdarazkha-debug/improve-system ~/.claude/skills/improve-system
```

No git? Download `SKILL.md` and `digest.mjs` and put both in `~/.claude/skills/improve-system/`.

## Use it

Open Claude Code and type:

```
/improve-system
```

Or just say "improve your system", "review my sessions" or "what skills should I build".

## What you get

A short report, 10 items at most, highest payoff first:

```
## Improve system: last 30 days

### Where it's going wrong
1. Captions come back too long. "shorter, I said 3 lines" (Oct 12, a1b2c3d4) x4
   Fix: add to CLAUDE.md: "Reel captions are 3 lines max."

### Explained twice
1. Your export folder, given in 5 sessions
   Fix: save it as a memory

### Skills you should already have
1. /caption-pack: writes the caption set you ask for after every video x19

### Do this by hand every day? Automate it
1. Copying the final file to Downloads x6. A hook can do it.

### What's working
- Your render checks catch bad frames before export
```

Every number comes from your own sessions. Every pattern shows the words you typed as proof.

## How it works

| File | Job |
| --- | --- |
| `digest.mjs` | Reads `~/.claude/projects/*/*.jsonl` and writes one compact digest: what you asked, when, and which tools and skills ran. |
| `SKILL.md` | Tells Claude how to read the digest, which patterns count, how to report them and how to apply the fixes. |

You can run the digest on its own:

```bash
node ~/.claude/skills/improve-system/digest.mjs --days 30 --out digest.md
```

| Option | Default | What it does |
| --- | --- | --- |
| `--days N` | 30 | How far back to read |
| `--max-chars N` | 600 | How much of each message to keep |
| `--out file.md` | prints to the terminal | Where to save the digest |

## Privacy

- `digest.mjs` only reads local files. It makes no network calls. It is 115 lines, so you can read all of it.
- Claude reads the digest in your normal Claude Code session, so its contents go to Anthropic the same way anything else you show Claude does. Nothing goes to any other service.
- The digest holds your own prompts, so keep it out of public folders.
- Nothing in your setup changes until you approve that exact change.

## Credit

Inspired by the `improve-system` command in the [BuildPartner plugin](https://github.com/austinmarchese/buildpartner-plugin). This is a separate version with no third-party service and no extra account. Claude Code's built-in `/insights` report pairs well with it.

## License

MIT. Use it, change it, share it.

Built by [Umer Daraz Khan](https://github.com/umerdarazkha-debug) with Claude Code. More at [@umer.does.ai](https://www.instagram.com/umer.does.ai/) and [YouTube](https://www.youtube.com/@umerdoesai).
