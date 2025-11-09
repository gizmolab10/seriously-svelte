import { k, Rect, Point, Angle, layout, svgPaths } from '../common/Global_Imports';
import { get } from 'svelte/store';
// import * as d3 from 'd3';
// import Two from 'two.js';

// create svg paths for generic arcs
// arc radii are smaller than ring radii
//
// given:
//	start, end & fork angles
//	w_ring_rotation_radius

export default class G_ArcSlider {
	clusters_center = Point.zero;
	label_center = Point.zero;
	tip_ofFork = Point.zero;
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	label_text_angle = 0;
	arc_rect = Rect.zero;
	angle_ofCluster = 0;
	isThumb = false;
	fork_radius = 0;
	start_angle = 0;
	cap_radius = 0;
	end_angle = 0;

	constructor(isThumb: boolean) {
		const radius = get(layout.w_ring_rotation_radius);
		this.clusters_center = Point.square(radius);
		this.isThumb = isThumb;
		if (isThumb) {
			const delta = k.thickness.separator.main / 3;
			this.outside_arc_radius = radius + k.thickness.paging_arc - delta + 1;
			this.cap_radius = k.radius.arcSlider_cap - delta;
			this.inside_arc_radius = radius + delta + 1;
		} else {
			this.outside_arc_radius = radius + k.thickness.paging_arc + 1;
			this.cap_radius = k.radius.arcSlider_cap;
			this.inside_arc_radius = radius + 1;
		}
	}

	static readonly _____PRIMITIVES: unique symbol;

	get spread_angle():			number { return this.end_angle - this.start_angle; }
	get angle_ofFork():			number { return (this.end_angle + this.start_angle) / 2 - this.offset_ofNadir; }
	get offset_ofNadir():		number { return (this.arc_straddles_nadir && !this.arc_straddles_zero) ? Angle.half : 0; }
	get fork_slants_forward(): boolean { return new Angle(this.angle_ofCluster).angle_slants_forward; }
	get fork_points_right():   boolean { return new Angle(this.angle_ofCluster).angle_points_right; }
	get fork_points_down():    boolean { return new Angle(this.angle_ofCluster).angle_points_down; }
	get straddles_zero():	   boolean { return this.end_angle.straddles_zero(this.start_angle); }
	get arc_straddles_nadir(): boolean { return this.arc_straddles(Angle.three_quarters); }
	get arc_straddles_zero():  boolean { return this.arc_straddles(0); }
	get arc_origin():			 Point { return this.arc_rect.origin; }
	get arc_center():			 Point { return this.arc_rect.center; }

	get compute_arc_rect(): Rect {
		let origin = Point.zero;
		let extent = Point.zero;
		const end_radial = this.radial_forAngle(this.end_angle);								// for each of start and end radials,
		const start_radial = this.radial_forAngle(this.start_angle);
		const start_x_isSmaller = start_radial.x < end_radial.x;								// for x and then for y
		const start_y_isSmaller = start_radial.y < end_radial.y;
		origin.x = (start_x_isSmaller ? start_radial.x : end_radial.x) - this.cap_radius;		// which radial's coordinate is smaller?
		origin.y = (start_y_isSmaller ? start_radial.y : end_radial.y) - this.cap_radius;		// subtract cap_radius
		extent.x = (start_x_isSmaller ? end_radial.x : start_radial.x) + this.cap_radius;		// vice-versa for larger
		extent.y = (start_y_isSmaller ? end_radial.y : start_radial.y) + this.cap_radius;
		return Rect.createExtentRect(origin, extent);
	}

	arc_straddles(angle: number): boolean { return (this.start_angle.angle_normalized() > angle && this.end_angle.angle_normalized() < angle); }

	layout_forkTip(center: Point) {
		const radial = Point.fromPolar(this.inside_arc_radius, this.angle_ofFork);
		this.tip_ofFork = center.offsetBy(radial);
	}

	radial_forAngle(angle: number): Point {
		const middle_radius = this.inside_arc_radius + this.cap_radius;
		return Point.fromPolar(middle_radius, angle);
	}

	layout_fork(angle_ofCluster: number) {
		const fork_raw_radius = k.thickness.rotation_ring * 0.6;
		const fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - fork_backoff;
		this.angle_ofCluster = angle_ofCluster;
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(angle));
		return delta / Math.sqrt(1.5);
	}

	finalize_angles() {
		if (!this.fork_points_right) {
			[this.start_angle, this.end_angle] = [this.end_angle, this.start_angle];
		}
		this.arc_rect = this.compute_arc_rect;
	}

	static readonly _____SVG_PATHS: unique symbol;

	get svgPathFor_arcSlider(): string {
		return this.svgPathFor_arcSlider_using(this.inside_arc_radius, this.outside_arc_radius, this.cap_radius);
	}

	svgPathFor_start(start_angle: number, radius: number) {
		return svgPaths.startOutAt(this.clusters_center, radius, start_angle);
	}

	get svgPathFor_radialFork(): string {
		return svgPaths.line_atAngle(this.clusters_center, this.inside_arc_radius, this.angle_ofFork);
	}

	svgPathFor_arcSliderEdge(end_angle: number, radius: number, clockwise: boolean) {
		const sweep_flag = clockwise ? 0 : 1;
		return svgPaths.arc_partial(this.clusters_center, radius, 0, sweep_flag, end_angle);
	}

	svgPathFor_cap(arc_angle: number, clockwise: boolean, cap_radius: number) {
		const radial = this.radial_forAngle(arc_angle);
		const center = this.clusters_center.offsetBy(radial);
		const end_angle = arc_angle + (clockwise ? 0 : Math.PI);
		return svgPaths.arc_partial(center, cap_radius, 0, 1, end_angle);
	}

	get svgPathFor_bigArc(): string {
		const capRadius = k.thickness.rotation_ring / 2;
		const smallRadius = get(layout.w_ring_rotation_radius) + 1;
		const bigRadius = smallRadius + k.thickness.rotation_ring;
		return this.svgPathFor_arcSlider_using(smallRadius, bigRadius, capRadius);
	}

	svgPathFor_arcSlider_using(small_radius: number, big_radius: number, cap_radius: number): string {
		const start = this.start_angle;
		let end = this.end_angle;
		while (end < start) {
			end += Math.PI * 2;
		}
		const paths = [
			this.svgPathFor_start(start, big_radius),
			this.svgPathFor_arcSliderEdge(end, big_radius, false),
			this.svgPathFor_cap(end, false, cap_radius),
			this.svgPathFor_arcSliderEdge(start, small_radius, true),
			this.svgPathFor_cap(start, true, cap_radius),
		];
		return paths.join(k.space);
	}

}