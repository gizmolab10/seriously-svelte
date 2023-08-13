import { writable } from 'svelte/store';

export let firebaseDocuments = writable<{id:string}[]>();
export let stoppedEditingID = writable<string | null>();
export let editingID = writable<string | null>();
export let viewID = writable<string | null>();
export let hereID = writable<string | null>();
export let grabbedIDs = writable<string[]>();
export let build = writable<number>();
export let bulk = writable<string>();
