import { e, k, p, u, show, debug, search } from '../common/Global_Imports';
import { layout, databases } from '../common/Global_Imports';
import { stores, w_device_isMobile } from './Stores';
import { T_Theme } from '../common/Global_Imports';

export class Configuration {

	queryStrings = new URLSearchParams(window.location.search);
	allow_HorizontalScrolling = true;
	theme = T_Theme.standalone;
	allow_graph_editing = true;
	allow_title_editing = true;
	has_details_button = true;
	has_standalone_UI = true;
	allow_autoSave = true;
	erasePreferences = 0;
	allow_search = true;
	eraseDB = 0;

	configure() {
		
		//////////////////////////////////////
		//									//
		//	 first code called by the app	//
		//									//
		//////////////////////////////////////

		
		// DO NOT CHANGE THE ORDER OF THESE CALLS
		
		w_device_isMobile.set(u.device_isMobile);
		debug.apply_queryStrings();						// debugging
		stores.setup_defaults();
		search.setup_defaults();
		show.restore_preferences();							// visibility
		layout.restore_preferences();
		this.apply_queryStrings();						// must call before prefs and db
		databases.apply_queryStrings();
		p.restore_preferences();
		show.apply_queryStrings();
		e.setup();
	}

	apply_queryStrings() {
		const queryStrings	 = this.queryStrings;
        const eraseOptions	 = queryStrings.get('erase')?.split(k.comma) ?? [];
        const themeOptions	 = queryStrings.get('theme')?.split(k.comma) ?? [];
        const disableOptions = queryStrings.get('disable')?.split(k.comma) ?? [];
		for (const disableOption of disableOptions) {
			switch (disableOption) {
				case 'search':				this.allow_search			   = false; break;
				case 'auto_save':			this.allow_autoSave			   = false; break;
				case 'standalone_UI':		this.has_standalone_UI		   = false; break;
				case 'details':				this.has_details_button		   = false; break;
				case 'editGraph':			this.allow_graph_editing	   = false; break;
				case 'editTitles':			this.allow_title_editing	   = false; break;
				case 'horizontalScrolling': this.allow_HorizontalScrolling = false; break;
			}
		}
		for (const eraseOption of eraseOptions) {
			switch (eraseOption) {
				case 'data':	 this.eraseDB = 4;		break;
				case 'settings': p.preferences_reset(); break;
			}
		}
		for (const themeOption of themeOptions) {
			switch (themeOption) {
				case 'bubble':	   this.theme = T_Theme.bubble;		break;
				case 'standalone': this.theme = T_Theme.standalone; break;
			}
		}
    }

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
	}

	get siteTitle(): string {
		const idBase = databases.db_now.idBase;
		const t_database = databases.db_now.t_database;
		const host = this.isServerLocal ? 'local' : 'remote';
		const base_name = idBase ? (idBase + ', ') : k.id_base.unknown;
		const db_name = t_database ? (t_database + ', ') : k.id_base.unknown;
		return `Seriously (${host}, ${db_name}${base_name}${u.browserType}, α)`;
	}

}

export let c = new Configuration();
