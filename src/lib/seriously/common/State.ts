import { writable } from 'svelte/store';
import Thing from '../data/Thing';

export let editingID = writable<string | null>();
export let focus = writable<Thing | null>();