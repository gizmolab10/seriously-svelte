import { e, k, p, u, w, show, debug, layouts, databases } from '../common/Global_Imports';
import { stores, w_device_isMobile } from '../common/Stores';

export class Configuration {

	eraseDB = 0;
	erasePreferences = 0;
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;
	queryStrings = new URLSearchParams(window.location.search);

	configure() {
		
		//////////////////////////////////////////////////
		//												//
		//												//
		//	 this is the first code called by the app	//
		//												//
		//												//
		//////////////////////////////////////////////////

		w_device_isMobile.set(this.device_isMobile);
		debug.queryStrings_apply();						// debug even setup code
		stores.setup_defaults();
		show.restore_state();							// local persistance
		layouts.layout_tops_forPanelBanners();
		w.restore_state();
		this.queryStrings_apply();						// must call before prefs and db
		p.restore_defaults();
		databases.restore_db();
		show.queryStrings_apply();
		e.setup();
	}

	queryStrings_apply() {
		const queryStrings = this.queryStrings;
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
        const disableOptions = queryStrings.get('disable')?.split(k.comma) ?? [];
		for (const disableOption of disableOptions) {
			switch (disableOption) {
				case 'editGraph':			this.allow_GraphEditing		   = false; break;
				case 'editTitles':			this.allow_TitleEditing		   = false; break;
				case 'horizontalScrolling': this.allow_HorizontalScrolling = false; break;
			}
		}
		for (const eraseOption of eraseOptions) {
			switch (eraseOption) {
				case 'data':	 this.eraseDB = 2;			break;
				case 'settings': this.erasePreferences = 2; break;
			}
		}
    }

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
	}

	get siteTitle(): string {
		const t_database = databases.db_now.t_database;
		const idBase = databases.db_now.idBase;
		const host = this.isServerLocal ? 'local' : 'remote';
		const db_name = t_database ? (t_database! + ', ') : k.empty;
		const base_name = idBase ? (idBase! + ', ') : k.empty;
		return `Seriously (${host}, ${db_name}${base_name}${u.browserType}, α)`;
	}

	get device_isMobile(): boolean {
		const userAgent = navigator.userAgent;
		if (/android/i.test(userAgent) || /iPhone|iPad|iPod/i.test(userAgent)) {    // Check for phones
			return true;
		}
		if (/iPad|Android|Touch/i.test(userAgent) && !(window as any).MSStream) {    // Check for tablets
			return true;
		}
		return false;
	}

	open_tabFor(url: string) { window.open(url, 'help-webseriously')?.focus(); }
	showHelp() { this.open_tabFor(this.isServerLocal ? k.local_help_url : k.remote_help_url); }

}

export let c = new Configuration();
