import { writable } from 'svelte/store';

export let lastUngrabbedID = writable<string | null>();
export let editingID = writable<string | null>();
export let grabbedIDs = writable<[string]>();
