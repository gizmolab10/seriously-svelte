import { k, Rect, Point, Angle, svgPaths } from '../common/Global_Imports';
import { w_ring_rotation_radius } from '../common/Stores';
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
	fork_radius = 0;
	start_angle = 0;
	cap_radius = 0;
	end_angle = 0;

	constructor(forThumb: boolean = false) {
		const thickness = k.thickness.paging_arc;
		const radius = get(w_ring_rotation_radius);
		this.outside_arc_radius = radius + thickness + 1;
		this.clusters_center = Point.square(radius);
		this.cap_radius = k.radius.arcSlider_cap;
		this.inside_arc_radius = radius + 1;
		if (forThumb) {
			const delta = k.thickness.separator / 3;
			this.outside_arc_radius -= delta;
			this.inside_arc_radius += delta;
			this.cap_radius -= delta;		
		}
	}

		tweak_forThumb() {
	}

	static readonly _____PRIMITIVES: unique symbol;

	get spread_angle():			number { return this.end_angle - this.start_angle; }
	get angle_ofFork():			number { return (this.end_angle + this.start_angle) / 2 - this.offset_ofNadir; }
	get offset_ofNadir():		number { return (this.arc_straddles_nadir && !this.arc_straddles_zero) ? Angle.half : 0; }
	get fork_slantsForward():  boolean { return new Angle(this.angle_ofCluster).angle_slantsForward; }
	get straddles_zero():	   boolean { return this.end_angle.straddles_zero(this.start_angle); }
	get fork_orientsDown():	   boolean { return new Angle(this.angle_ofCluster).angle_orientsDown; }
	get fork_pointsRight():	   boolean { return new Angle(this.angle_ofCluster).angle_pointsRight; }
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

	radial_forAngle(angle: number): Point {
		const middle_radius = this.inside_arc_radius + this.cap_radius;
		return Point.fromPolar(middle_radius, angle);
	}

	layout_fork(angle_ofCluster: number) {
		const fork_raw_radius = k.thickness.ring_rotation * 0.6;
		const fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.fork_radius = fork_raw_radius - fork_backoff;
		this.angle_ofCluster = angle_ofCluster;
	}

	layout_forkTip(center: Point) {
		const radial = Point.fromPolar(this.inside_arc_radius, this.angle_ofFork);
		this.tip_ofFork = center.offsetBy(radial);
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(angle));
		return delta / Math.sqrt(1.5);
	}

	finalize_angles() {
		if (!this.fork_pointsRight) {
			[this.start_angle, this.end_angle] = [this.end_angle, this.start_angle];
		}
		this.arc_rect = this.compute_arc_rect;
	}

	static readonly _____SVG_PATHS: unique symbol;

	get svgPathFor_arcSlider(): string {
		const start = this.start_angle;
		let end = this.end_angle;
		while (end < start) {
			end += Math.PI * 2;
		}
		const paths = [
			this.svgPathFor_start(start, this.outside_arc_radius),
			this.svgPathFor_arcSliderEdge(end, this.outside_arc_radius, false),
			this.svgPathFor_cap(end, false),
			this.svgPathFor_arcSliderEdge(start, this.inside_arc_radius, true),
			this.svgPathFor_cap(start, true),
		];
		return paths.join(k.space);
	}

	// get two_svgPathFor_arcSlider(): string {
	// 	const width = get(w_ring_rotation_radius) + k.radial_widget_inset;
	// 	const height = width;
	// 	const two = new Two({ width, height });
	// 	const arc = two.makeArcSegment(
	// 		this.clusters_center.x,
	// 		this.clusters_center.y,
	// 		this.inside_arc_radius,
	// 		this.outside_arc_radius,
	// 		this.start_angle,
	// 		this.end_angle
	// 	);
	// 	return '';
	// }

	// get d3_svgPathFor_arcSlider(): string {
	// 	const path = d3.arc()({
	// 		innerRadius: this.inside_arc_radius,
	// 		outerRadius: this.outside_arc_radius,
	// 		startAngle: this.start_angle,
	// 		endAngle: this.end_angle
	// 	});
	// 	return path || '';
	// }

	svgPathFor_start(start_angle: number, radius: number) {
		return svgPaths.startOutAt(this.clusters_center, radius, start_angle);
	}

	svgPathFor_arcSliderEdge(end_angle: number, radius: number, clockwise: boolean) {
		const sweep_flag = clockwise ? 0 : 1;
		return svgPaths.arc_partial(this.clusters_center, radius, 0, sweep_flag, end_angle);
	}

	svgPathFor_cap(arc_angle: number, clockwise: boolean) {
		const radial = this.radial_forAngle(arc_angle);
		const center = this.clusters_center.offsetBy(radial);
		const end_angle = arc_angle + (clockwise ? 0 : Math.PI);
		return svgPaths.arc_partial(center, this.cap_radius, 0, 1, end_angle);
	}

	get svgPathFor_radialFork(): string {
		return svgPaths.line_atAngle(this.clusters_center, this.inside_arc_radius, this.angle_ofFork);
	}

}