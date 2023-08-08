import { writable } from 'svelte/store';

export let stoppedEditingID = writable<string | null>();
export let lastUngrabbedID = writable<string | null>();
export let editingID = writable<string | null>();
export let grabbedIDs = writable<[string]>();
