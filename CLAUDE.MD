# CLAUDE.MD

ENV: Claude Desktop (not web)
NO `worktrees`/`workspaces`
REPO: `/Users/sand/GitHub/webseriously` (only this)
NEVER change code without permission + consent
FS: Verify local filesystem access works (you CAN write to my repo—don't claim otherwise)

Docs style: voice.md | Keep TOC updated
Temp: `/home/claude` | Outputs: `/mnt/user-data/outputs`

COMMANDS:

* "n" → no
* "y" → yes
* "ni" → no improvement
* "read claude" → reread `CLAUDE.MD`
* "update docs" → run `./notes/tools/update-docs.sh`, report output
* "work on <file>" → if `notes/designs/work/<file>.md` missing, create it + run `notes/designs/guides/chat.md` else read + resume

MEMORY: Use `conversation_search/recent_chats` before claiming no context
FILES: Always read current version before editing