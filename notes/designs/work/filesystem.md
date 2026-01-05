# Work: Filesystem

Started: 2025-01-04

## Problem

Need a way to visualize filesystem folders in webseriously. Currently no database plugin exists that can scan a folder and represent files/folders as Things with navigable relationships.

## Goal

Build `DB_Filesystem` plugin that:
1. Takes a folder path as input
2. Creates Things from files/folders
3. Creates Relationships (parent→child folder structure)
4. Each Thing gets a `link` Trait that opens the file via OS default app


## Approach

**Browser constraints:**
- True "open in OS app" impossible from pure web app (security)
- File System Access API for folder reading (Chrome/Edge ~70% desktop)
- No Tauri/Electron—keep as web app

**Solution:**
- [x] Use File System Access API to read folder contents
- [x] Create Things from files/folders
- [x] Create Relationships for parent→child structure
- [x] `link` trait stores file handle
	- [x] Except not for files whose extensions do not enable preview
- [x] Click → in-app preview (images, text, PDF, video, audio) + download button
	- [x] make these buttons the same style as are used in build notes
		- [x] including background and other color choices from build notes
	- [x] if cannot preview, just call grab without showing preview
- [x] Copy-path button for manual OS opening (copies file path to clipboard for pasting into Finder/Explorer)
- [x] in D_Data, remove `filesystem` from `ids_forDatabase` if isSupported returns `false`
- [x] When a file is selected, that `isPreviewable`, and the user clicks the right arrow, then also show preview for that file
- [ ] Remember and make it easy to revisit the last folder choice
	- [ ] Use a Preferences key
	- [ ] Change the behavior of click on "Clik here to brow..." to do this

**Limitations:** Safari/Firefox users won't get folder picking (can still manually add files)

## Notes

🔖 RESUME POINT: DB_Filesystem plugin created and registered

### Done
- [x] Added `filesystem` to T_Database and DB_Name enums
- [x] Created DB_Filesystem.ts with:
  - File System Access API integration
  - Recursive folder scanning
  - Thing creation per file/folder
  - Relationship creation (contains)
  - Link trait with file path
  - Helper methods: readFileAsText, readFileAsDataURL, downloadFile, copyPath
  - Color coding by file extension
- [x] Registered in Databases.ts (db_forType + db_next_get cycle)
- [x] Fixed stale rootAncestry/root references after folder selection (clear caches in selectFolder)
- [x] Created Preview.svelte component with full-screen overlay for file previews
- [x] Added T_Control.preview enum and preview stores to Visibility.ts
- [x] Widget click on root (no folder) → triggers folder picker
- [x] Widget click on file → shows preview + grabs ancestry for breadcrumbs/details
- [x] Moved preview logic to Visibility.ts as `show_preview_ofFile(fileId): Promise<boolean>`
- [x] Returns false for non-previewable files (wrong DB, directory, unsupported extension)
- [x] Renamed interfaces to Snake_Case per style guide:
  - FileSystemHandle → File_System_Handle
  - FileSystemFileHandle → File_System_File_Handle  
  - FileSystemDirectoryHandle → File_System_Directory_Handle
  - FilePickerOptions → File_Picker_Options
  - FileEntry → File_Entry

### TODO
- [ ] Handle non-previewable files gracefully in UI
- [ ] Add more preview types (PDF, audio, video)

