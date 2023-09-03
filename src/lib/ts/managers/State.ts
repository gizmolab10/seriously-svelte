import { writable } from 'svelte/store';

export const stoppedEditingID   = writable<string | null>();
export const popupViewID        = writable<string | null>();
export const editingID          = writable<string | null>();
export const hereID             = writable<string | null>();
export const grabbedIDs         = writable<string[]>();
export const thingsArrived      = writable<boolean>();
export const showDetails        = writable<boolean>();
export const isBusy             = writable<boolean>();
export const debug              = writable<boolean>();
export const bulkName           = writable<string>();
export const dbType             = writable<string>();
export const build              = writable<number>();