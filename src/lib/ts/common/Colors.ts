import { transparentize } from 'color2k';

export class Colors {
	default = 'black';
	background = 'white';
    disabled = 'lightGray';
	separator = '#eeeeeee0';
    default_forThings = 'blue';

	opacitize(color: string, amount: number): string {
		return transparentize(color, 1 - amount);
	}

	separatorFor(background: string): string {
		let color = '#eeeeeee0';
		if (!this.colors_areIdentical(background, this.background)) {
			const separator = this.multiply_saturationOf_by(background, 5);
			if (!!separator) {
				color = separator;
			}
		}
		return color;
	}

	static readonly SATURATION: unique symbol;

	multiply_saturationOf_by(color: string, ratio: number): string | null {
		let hsba = this.color_toHSBA(color);
		if (!!hsba) {
			hsba.s = Math.min(255, hsba.s * ratio);
			const rgba = this.HSBA_toRGBA(hsba);
			return this.RGBA_toHex(rgba)
		}
		return null
	}

	static readonly LUMINANCE: unique symbol;
	
	darkerBy(color: string, ratio: number): string | null {
		return this.adjust_luminance_byApplying(color, (lume => {
			return (1 - lume) * (1 + ratio);
		}));
	}

	lighterBy(color: string, ratio: number): string | null {
		return this.adjust_luminance_byApplying(color, (lume => {
			return 1 - (lume * (1 - ratio));
		}));
	}

	luminance_ofColor(color: string): number | null {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.luminance_ofRGBA(rgba);
		}
		return null
	}

	luminance_ofRGBA(rgba: RGBA): number | null {
		if (!!rgba) {
			const linearize = (c: number) => {
				const s = c / 255;
				return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
			};
			const R = linearize(rgba.r);
			const G = linearize(rgba.g);
			const B = linearize(rgba.b);
			const relative = 0.2126 * R + 0.7152 * G + 0.0722 * B;		// according to WCAG
			return rgba.a * relative + (1 - rgba.a) * 1;				// assume white background with luminance = 1
		}
		return null;
	}

	adjust_luminance_byApplying(color: string, closure: (lume: number) => number): string | null {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			const lume = this.luminance_ofRGBA(rgba);
			if (!!lume) {
				const dark = closure(lume);
				return this.set_darkness_toRGBA(rgba, dark);
			}
		}
		return null;
	}

	static readonly DARKNESS: unique symbol;

	set_darkness_toRGBA(rgba: RGBA, darkness: number): string | null {
		const adjusted = this.adjust_RGBA_forDarkness(rgba, darkness);
		const rgba_new = adjusted.result;
		if (!adjusted.error && !!rgba_new) {
			return this.RGBA_toHex(rgba_new);
		}
		return null
	}

	adjust_RGBA_forDarkness(rgba: RGBA, targetDarkness: number): {result: RGBA | null, error: Error | null} {
		
		///////////////////////////////////////////////////////////////////////////////////
		// Adjusts an RGBA color so that its "perceived darkness" 
		//		equals the given target darkness.
		// returns an Error if a valid adjustment cannot be computed.
		//  Darkness is defined here as:
		// 	 darkness = 1 - (a * Y + (1 - a) * 1)
		//  where Y is the relative luminance computed from the linearized sRGB values.
		// 
		//  The function scales the color channels (preserving hue/saturation) such that:
		// 	 Y_new = 1 - (targetDarkness / a)
		///////////////////////////////////////////////////////////////////////////////////

		const r = rgba.r;
		const g = rgba.g;
		const b = rgba.b;
		const a = rgba.a;
		if (a === 0) {			// Check alpha constraints:
			if (targetDarkness !== 0) {
				return {result: rgba, error: new Error("With zero alpha, only target darkness 0 is possible.")};
			}
		}
		if (targetDarkness > a) {
			return {result: rgba, error: new Error("Target darkness must be <= alpha.")};
		}
		const srgbToLinear = (c: number): number => {
			// Helper to convert sRGB channel [0,255] to linear value [0,1]
			const s = c / 255;
			return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
		};
		const linearToSrgb = (c: number): number => {
			// Helper to convert linear value [0,1] to sRGB channel [0,1]
			return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
		};
		const R_lin = srgbToLinear(r);		// Convert original channels to linear space
		const G_lin = srgbToLinear(g);
		const B_lin = srgbToLinear(b);
		const Y = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin;		// Compute current relative luminance Y
		if (Y === 0) {			// If the color is black and target darkness is not full darkness, we can't scale from 0.
			if (targetDarkness !== 1) {
				return {result: null, error: new Error("Cannot adjust a black color to be lighter while preserving hue.")};
			}
			return {result: rgba, error: null}; // already black
		}
		// Compute the desired relative luminance from target darkness:
		// effective luminance = 1 - targetDarkness must equal a * Y_new + (1-a)*1,
		// so Y_new = ( (1 - targetDarkness) - (1-a) ) / a = (a - targetDarkness) / a.
		const Y_new = (a - targetDarkness) / a;
		if (Y_new < 0 || Y_new > 1) {
			return {result: null, error: new Error("Computed target luminance out of range.")};
		}
		const k = Y_new / Y;		// Compute scaling factor k to adjust the color channels
		const R_new_lin = Math.min(R_lin * k, 1);		// Scale each channel in linear space (clamping to 1 if necessary)
		const G_new_lin = Math.min(G_lin * k, 1);
		const B_new_lin = Math.min(B_lin * k, 1);
		const R_new = Math.round(linearToSrgb(R_new_lin) * 255);		// Convert back to sRGB (and then to 0-255 integer values)
		const G_new = Math.round(linearToSrgb(G_new_lin) * 255);
		const B_new = Math.round(linearToSrgb(B_new_lin) * 255);

		return {result: new RGBA(R_new, G_new, B_new, a), error: null};
	}

	static readonly CONVERSIONS: unique symbol;

	colors_areIdentical(a: string, b: string): boolean {
		const aHex = this.color_toHex(a);
		const bHex = this.color_toHex(b);
		if (!!aHex && !!bHex) {
			return aHex == bHex;
		}
		return false;
	}

	color_toHex(color: string): string | null {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.RGBA_toHex(rgba);
		}
		return null;
	}

	color_toHSBA(color: string): HSBA | null {
		const rgba = this.color_toRGBA(color);
		if (!!rgba) {
			return this.RBGA_toHSBA(rgba);
		}
		return null;
	}

	color_toRGBA(color: string): RGBA | null {
		const div = document.createElement('div');
		div.style.color = color;
		document.body.appendChild(div);
		const computedColor = window.getComputedStyle(div).color;
		document.body.removeChild(div);
		const rgba = computedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/);
		if (rgba) {
			return new RGBA(
				parseInt(rgba[1], 10),
				parseInt(rgba[2], 10),
				parseInt(rgba[3], 10),
				rgba[4] ? parseFloat(rgba[4]) : 1		 // Default alpha to 1 (fully opaque) if not present
			)
		}
		return null;
	}

	RGBA_toHex(rgba: RGBA, omitAlpha: boolean = true): string {
		const r = Math.min(255, Math.max(0, rgba.r));		// Ensure the values are in the valid range
		const g = Math.min(255, Math.max(0, rgba.g));
		const b = Math.min(255, Math.max(0, rgba.b));
		const a = Math.min(1, Math.max(0, rgba.a));
		const rHex = r.toString(16).padStart(2, '0');		// Convert RGB to 2-digit hex
		const gHex = g.toString(16).padStart(2, '0');
		const bHex = b.toString(16).padStart(2, '0');
		const aHex = Math.round(a * 255).toString(16).padStart(2, '0');		// Convert alpha to a 2-digit hex (scale it to 255)
		const withoutAlpha = `#${rHex}${gHex}${bHex}`;
		if (omitAlpha) {
			return withoutAlpha;					// Return the hex color in rgb format
		} else {
			return `${withoutAlpha}${aHex}`;		// Return the hex color in rgba format
		}
	}

	HSBA_toRGBA(hsba: HSBA): RGBA {
		const h = hsba.h;
		const s = hsba.s / 100;
		const b = hsba.b / 100;
		const a = hsba.a;
		const c = b * s; // Chroma
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = b - c;
		let r = 0, g = 0, b2 = 0;
		if (h >= 0 && h < 60) {
			r = c;
			g = x;
			b2 = 0;
		} else if (h >= 60 && h < 120) {
			r = x;
			g = c;
			b2 = 0;
		} else if (h >= 120 && h < 180) {
			r = 0;
			g = c;
			b2 = x;
		} else if (h >= 180 && h < 240) {
			r = 0;
			g = x;
			b2 = c;
		} else if (h >= 240 && h < 300) {
			r = x;
			g = 0;
			b2 = c;
		} else if (h >= 300 && h < 360) {
			r = c;
			g = 0;
			b2 = x;
		}
		// Add m to each RGB value
		r = Math.round((r + m) * 255);
		g = Math.round((g + m) * 255);
		b2 = Math.round((b2 + m) * 255);
		return new RGBA(r, g, b2, a);
	}

	RBGA_toHSBA(rgba: RGBA): HSBA {
		const r = rgba.r / 255;
		const g = rgba.g / 255;
		const b = rgba.b / 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;
		let h = 0;
		if (delta !== 0) {
			if (max === r) {
				h = (g - b) / delta;
			} else if (max === g) {
				h = (b - r) / delta + 2;
			} else {
				h = (r - g) / delta + 4;
			}
			h = (h * 60 + 360) % 360;
		}
		const s = max === 0 ? 0 : (delta / max) * 100;
		const bValue = max * 100;
		return new HSBA(h, s, bValue, rgba.a);
	}

}

class RGBA {
	r!: number;
	g!: number;
	b!: number;
	a!: number;
	constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 0) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
}

class HSBA {
	h!: number;
	s!: number;
	b!: number;
	a!: number;
	constructor(h: number = 0, s: number = 0, b: number = 0, a: number = 0) {
		this.h = h;
		this.s = s;
		this.b = b;
		this.a = a;
	}
}

export const colors = new Colors();
