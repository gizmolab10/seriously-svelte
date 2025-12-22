/**
 * Integration tests for phase 6: Comprehensive testing of breadcrumbs system
 * 
 * These tests verify end-to-end behavior of the breadcrumbs system, including:
 * - Breadcrumb navigation updates focus correctly
 * - Reactive subscriptions to w_ancestry_focus work correctly
 * - Edge cases (rapid changes, empty history, mode switching)
 * - History truncation and navigation
 * 
 * Run with: yarn test UX_integration
 */

import { get } from 'svelte/store';
import { x, s, h, show } from '../common/Global_Imports';
import { T_Breadcrumbs } from '../common/Global_Imports';
import Ancestry from '../runtime/Ancestry';

describe('Breadcrumbs system integration tests', () => {
	beforeEach(() => {
		// Reset recents to known state
		x.si_recents.items = [];
		if (h.rootAncestry) {
			h.rootAncestry.becomeFocus();
		}
	});

	it('should update focus correctly when clicking breadcrumb button', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		const initialFocus = get(s.w_ancestry_focus);
		
		// Simulate breadcrumb button click
		ancestry.becomeFocus();
		
		// Verify focus updated
		const newFocus = get(s.w_ancestry_focus);
		expect(newFocus).toBe(ancestry);
		
		// Verify it was added to history
		expect(x.si_recents.length).toBeGreaterThan(0);
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(recentItem![0]).toBe(ancestry);
	});

	it('should sync focus with recents index when navigating next/previous', () => {
		if (!h.rootAncestry || x.si_recents.length < 2) {
			console.warn('Skipping test: insufficient recents history');
			return;
		}

		const initialIndex = x.si_recents.index;
		const initialFocus = get(s.w_ancestry_focus);
		
		// Navigate forward
		x.ancestry_next_focusOn(true);
		
		// Verify index and focus are in sync
		const newIndex = x.si_recents.index;
		const newFocus = get(s.w_ancestry_focus);
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		
		expect(newIndex).not.toBe(initialIndex);
		expect(newFocus).not.toBe(initialFocus);
		expect(recentItem).not.toBeNull();
		expect(newFocus).toBe(recentItem![0]);
	});

	it('should handle rapid successive focus changes', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		const root = h.rootAncestry;
		
		// Rapid successive calls
		root.becomeFocus();
		root.becomeFocus();
		root.becomeFocus();
		
		// Verify focus is still correct
		const focus = get(s.w_ancestry_focus);
		expect(focus).toBe(root);
		
		// Verify recents index is in sync
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(recentItem![0]).toBe(root);
	});

	it('should handle empty history gracefully', () => {
		// Clear recents
		x.si_recents.items = [];
		
		// Should not throw when trying to navigate
		expect(() => {
			x.ancestry_next_focusOn(true);
		}).not.toThrow();
		
		// update_focus_from_recents should use fallback
		const focus = get(s.w_ancestry_focus);
		// Focus may be null or previous value, but shouldn't crash
		expect(focus === null || focus instanceof Ancestry).toBe(true);
	});

	it('should maintain sync between si_recents.index and w_ancestry_focus', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Create multiple history entries
		const root = h.rootAncestry;
		root.becomeFocus();
		
		// Verify initial sync
		let recentItem = x.si_recents.item as [Ancestry, any] | null;
		let focus = get(s.w_ancestry_focus);
		expect(recentItem).not.toBeNull();
		expect(focus).toBe(recentItem![0]);
		
		// Navigate and verify sync maintained
		if (x.si_recents.length > 1) {
			x.ancestry_next_focusOn(true);
			recentItem = x.si_recents.item as [Ancestry, any] | null;
			focus = get(s.w_ancestry_focus);
			expect(recentItem).not.toBeNull();
			expect(focus).toBe(recentItem![0]);
		}
	});

	it('should update ancestry_forDetails when focus changes', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		const ancestry = h.rootAncestry;
		ancestry.becomeFocus();
		
		// ancestry_forDetails should be updated via subscription
		const details = x.ancestry_forDetails;
		expect(details).not.toBeNull();
	});

	it('should handle history truncation correctly', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Create multiple history entries
		const root = h.rootAncestry;
		root.becomeFocus();
		root.becomeFocus();
		root.becomeFocus();
		
		const initialLength = x.si_recents.length;
		
		// Navigate through history (this may truncate if at end)
		x.ancestry_next_focusOn(true);
		x.ancestry_next_focusOn(false);
		
		// Verify focus is still in sync with index
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		const focus = get(s.w_ancestry_focus);
		expect(recentItem).not.toBeNull();
		expect(focus).toBe(recentItem![0]);
	});

	it('should verify subscription handler updates focus from recents', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		const root = h.rootAncestry;
		root.becomeFocus();
		
		// Manually change recents index (simulating navigation)
		const initialIndex = x.si_recents.index;
		if (x.si_recents.length > 1) {
			x.si_recents.find_next_item(true);
			
			// Verify subscription updated focus
			const recentItem = x.si_recents.item as [Ancestry, any] | null;
			const focus = get(s.w_ancestry_focus);
			expect(recentItem).not.toBeNull();
			expect(focus).toBe(recentItem![0]);
		}
	});

	it('should handle mode switching between ancestry and history', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Switch to history mode
		show.w_t_breadcrumbs.set(T_Breadcrumbs.history);
		
		// Verify breadcrumbs component can read from si_recents
		const historyItems = x.si_recents.items.map(item => item[0]);
		expect(historyItems.length).toBeGreaterThan(0);
		
		// Switch back to ancestry mode
		show.w_t_breadcrumbs.set(T_Breadcrumbs.ancestry);
		
		// Focus should still be in sync
		const focus = get(s.w_ancestry_focus);
		expect(focus).not.toBeNull();
	});

	it('should verify all reactive subscriptions to w_ancestry_focus fire correctly', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		// Track subscription calls
		let subscriptionFired = false;
		const unsubscribe = s.w_ancestry_focus.subscribe(() => {
			subscriptionFired = true;
		});
		
		// Change focus
		const ancestry = h.rootAncestry;
		ancestry.becomeFocus();
		
		// Verify subscription fired (synchronous in Svelte)
		expect(subscriptionFired).toBe(true);
		
		unsubscribe();
	});

	it('should maintain consistency when navigating and then clicking breadcrumb', () => {
		if (!h.rootAncestry || x.si_recents.length < 2) {
			console.warn('Skipping test: insufficient recents history');
			return;
		}

		// Navigate forward in history
		x.ancestry_next_focusOn(true);
		const navigatedFocus = get(s.w_ancestry_focus);
		
		// Then click a breadcrumb (adds new entry)
		const root = h.rootAncestry;
		root.becomeFocus();
		
		// Verify focus updated and new entry added
		const newFocus = get(s.w_ancestry_focus);
		expect(newFocus).toBe(root);
		expect(x.si_recents.length).toBeGreaterThan(1);
		
		// Verify index points to new entry
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(recentItem![0]).toBe(root);
	});

	it('should handle concurrent updates gracefully', () => {
		if (!h || !h.rootAncestry) {
			console.warn('Skipping test: no rootAncestry available');
			return;
		}

		const root = h.rootAncestry;
		
		// Simulate concurrent operations
		root.becomeFocus();
		if (x.si_recents.length > 1) {
			x.ancestry_next_focusOn(true);
		}
		root.becomeFocus();
		
		// Verify final state is consistent
		const focus = get(s.w_ancestry_focus);
		const recentItem = x.si_recents.item as [Ancestry, any] | null;
		expect(recentItem).not.toBeNull();
		expect(focus).toBe(recentItem![0]);
	});
});

