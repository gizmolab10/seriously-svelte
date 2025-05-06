import { e, k, p, u, w, show, debug, layout, databases } from '../common/Global_Imports';
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
		debug.queryStrings_apply();						// debugging
		stores.setup_defaults();
		show.restore_state();							// local persistance
		layout.layout_tops_forPanelBanners();
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
		const idBase = databases.db_now.idBase;
		const t_database = databases.db_now.t_database;
		const host = this.isServerLocal ? 'local' : 'remote';
		const base_name = idBase ? (idBase + ', ') : k.empty;
		const db_name = t_database ? (t_database + ', ') : k.empty;
		return `Seriously (${host}, ${db_name}${base_name}${u.browserType}, α)`;
	}

	get device_isMobile(): boolean { return ('ontouchstart' in window || navigator.maxTouchPoints > 0); }

	get xdevice_isMobile(): boolean {
		const userAgent = navigator.userAgent;
		if (/iPhone|iPad|iPod/i.test(userAgent) ||
			/Windows Phone/i.test(userAgent) ||
			/BlackBerry/i.test(userAgent) ||
			/Opera Mini/i.test(userAgent) ||
			/IEMobile/i.test(userAgent) ||
			/android/i.test(userAgent) ||
			/Mobile/i.test(userAgent) ||
			/Tablet/i.test(userAgent) ||
			/webOS/i.test(userAgent) ||
			/Touch/i.test(userAgent)) {    // Check for phones and tablets
			return true;
		}
		return false;
	}

	open_tabFor(url: string) { window.open(url, 'help-webseriously')?.focus(); }
	showHelp() { this.open_tabFor(this.isServerLocal ? k.help_url.local : k.help_url.remote); }

}

export let c = new Configuration();
