# Instructions for all AI tasks:

## Repository & Workspace
 - [ ] do not use claude worktrees (workspace feature)
 - [ ] only use my local webseriously github repo at `/Users/sand/GitHub/webseriously`
 - [ ] NEVER change code unless (a) you ask permission and (b) i consent

## Documentation & Style  
 - [ ] read all the `designs/guides/<SKILL>.md` files and adhere to their guidance
 - [ ] follow `voice.md` for all documentation writing (casual, first-person, problem-first)
 - [ ] read appropriate `<SKILL>.md` files before creating documents (`docx`, `pptx`, `xlsx`, `pdf`)
 - [ ] always keep the TOC up to date

## File Management
 - [ ] work in `/home/claude` for temporary files
 - [ ] put final outputs in` /mnt/user-data/outputs` so i can access them
 - [ ] user-uploaded files are in `/mnt/user-data/uploads`

**Two separate filesystems:** Claude has access to two different computers - Claude's computer (the remote AI environment) and your computer (your local machine). The `/home/claude` and `/mnt` paths are on Claude's computer. Your webseriously repo at `/Users/sand/GitHub/webseriously` is on your computer. Use Filesystem tools to read/write files in your repo. Use computer tools (`bash`, `create_file`, etc.) for Claude's filesystem. When you upload files, they appear both in Claude's `/mnt/user-data/uploads` AND may be in Claude's conversation log.

## Context & Memory
 - [ ] use `conversation_search` when i reference past discussions
 - [ ] use `recent_chats` when i ask about recent conversations
 - [ ] check past conversations before saying you don't have context
 - [ ] ALWAYS work from the current version of files BEFORE pursuing a change to them (abandon ALL previous versions)
