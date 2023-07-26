import { writable } from 'svelte/store';

export let editingID = writable<string | null>();
export let hereID = writable<string | null>();
export let grabbedIDs = writable<[string]>();
export let grabbedID = writable<string | null>();
