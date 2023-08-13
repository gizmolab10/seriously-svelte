import { writable } from 'svelte/store';

export let firebaseDocuments = writable<{id:string}[]>();
export let stoppedEditingID = writable<string | null>();
export let popupViewID = writable<string | null>();
export let editingID = writable<string | null>();
export let hereID = writable<string | null>();
export let grabbedIDs = writable<string[]>();
export let fireBulk = writable<string>();
export let dbType = writable<string>();
export let build = writable<number>();
