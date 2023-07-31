import { writable } from 'svelte/store';

export let editingID = writable<string | null>();
export let grabbedID = writable<string | null>();
export let grabbedIDs = writable<[string]>();
