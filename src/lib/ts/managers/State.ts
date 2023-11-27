import { Rect, Point } from '../geometry/Geometry';
import { writable } from 'svelte/store';

export const idShowRevealCluster	= writable<string | null>();
export const idEditingStopped   	= writable<string | null>();
export const popupViewID			= writable<string | null>();
export const idEditing				= writable<string | null>();
export const idHere					= writable<string | null>();
export const dbLoadTime 			= writable<string | null>();
export const expanded				= writable<string[]>();
export const idsGrabbed				= writable<string[]>();
export const thingsArrived			= writable<boolean>();
export const showDetails			= writable<boolean>();
export const isBusy					= writable<boolean>();
export const dbType					= writable<string>();
export const thingFontFamily		= writable<string>();
export const thingFontSize			= writable<number>();
export const lineStretch			= writable<number>();
export const crumbsWidth  			= writable<number>();
export const lineGap				= writable<number>();
export const dotSize			  	= writable<number>();
export const build					= writable<number>();
export const user_graphOffset		= writable<Point>();
export const graphRect  			= writable<Rect>();

lineGap.subscribe(($lineGap) => {
	thingFontSize.set($lineGap * 7 / 8);
	dotSize.set($lineGap * 2 / 3);
});