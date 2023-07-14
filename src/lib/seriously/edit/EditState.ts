import { writable } from 'svelte/store';

export let editingID = writable<string | null>();