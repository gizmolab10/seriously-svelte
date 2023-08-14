import { writable } from 'svelte/store';

export let firebaseDocuments = writable<{id:string}[]>();
export let stoppedEditingID  = writable<string | null>();
export let popupViewID       = writable<string | null>();
export let editingID         = writable<string | null>();
export let hereID            = writable<string | null>();
export let grabbedIDs        = writable<string[]>();
export let showDetails       = writable<boolean>();
export let isBusy            = writable<boolean>();
export let privateBulk          = writable<string>();
export let dbType            = writable<string>();
export let build             = writable<number>();
