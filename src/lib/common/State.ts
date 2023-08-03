import { writable } from 'svelte/store';

export let lastGrabbedID = writable<string | null>();
export let editingID = writable<string | null>();
export let grabbedIDs = writable<[string]>();
