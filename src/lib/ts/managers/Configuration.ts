import { e, k, p, s, u, show, debug, search, colors, layout, features, databases } from '../common/Global_Imports';

export class Configuration {

	queryStrings = new URLSearchParams(window.location.search);
	erasePreferences = 0;
	eraseDB = 0;

	configure() {
		
		//////////////////////////////////////
		//									//
		//	 first code called by the app	//
		//									//
		//////////////////////////////////////

		// DO NOT CHANGE THE ORDER OF THESE CALLS

		s.w_device_isMobile.set(u.device_isMobile);
		debug.apply_queryStrings();
		colors.restore_preferences();
		search.setup_defaults();
		this.apply_queryStrings();						// must call before prefs and db
		features.apply_queryStrings();
		layout.restore_preferences();
		databases.apply_queryStrings();
		p.restore_preferences();
		show.restore_preferences();
		show.apply_queryStrings();
		e.setup();
	}

	apply_queryStrings() {
		const queryStrings	 = this.queryStrings;
        const eraseOptions	 = queryStrings.get('erase')?.split(k.comma) ?? [];
		for (const eraseOption of eraseOptions) {
			switch (eraseOption) {
				case 'data':	 this.eraseDB = 4;		break;
				case 'settings': p.preferences_reset(); break;
			}
		}
    }

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
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

export const c = new Configuration();
