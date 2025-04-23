import { k, Rect, Point, Angle, svgPaths } from '../common/Global_Imports';
import { w_ring_rotation_radius } from '../common/Stores';
import { get } from 'svelte/store';

// create svg paths for generic arcs
// arc radii are smaller than ring radii
//
// given:
//	start, end & fork angles
//	w_ring_rotation_radius

export default class G_ArcSlider {
	clusters_center = Point.zero;
	outside_arc_radius = 0;
	inside_arc_radius = 0;
	label_text_angle = 0;
	arc_rect = Rect.zero;
	angle_ofFork = 0;
	fork_backoff = 0;
	fork_radius = 0;
	start_angle = 0;
	cap_radius = 0;
	end_angle = 0;

	constructor() {
		const thickness = k.thickness.paging_arc;
		const radius = get(w_ring_rotation_radius);
		this.clusters_center = Point.square(radius);
		this.outside_arc_radius = radius + thickness;
		this.cap_radius = k.thickness.ring_rotation / 6;
		this.inside_arc_radius = radius;
	}

	static readonly PRIMITIVES: unique symbol;

	get spread_angle():			number { return this.end_angle - this.start_angle; }
	get angle_ofCenter():		number { return (this.end_angle + this.start_angle) / 2 - this.offset_ofNadir; }
	get offset_ofNadir():		number { return (this.arc_straddles_nadir && !this.arc_straddles_zero) ? Angle.half : 0; }
	get fork_slantsForward():  boolean { return new Angle(this.angle_ofFork).angle_slantsForward; }
	get straddles_zero():	   boolean { return this.end_angle.straddles_zero(this.start_angle); }
	get fork_orientsDown():	   boolean { return new Angle(this.angle_ofFork).angle_orientsDown; }
	get fork_pointsRight():	   boolean { return new Angle(this.angle_ofFork).angle_pointsRight; }
	get arc_straddles_nadir(): boolean { return this.arc_straddles(Angle.three_quarters); }
	get arc_straddles_zero():  boolean { return this.arc_straddles(0); }
	get radial_ofFork():		 Point { return Point.fromPolar(get(w_ring_rotation_radius), this.angle_ofFork); }
	get arc_origin():			 Point { return this.arc_rect.origin; }
	get arc_center():			 Point { return this.arc_rect.center; }

	get computed_arc_rect(): Rect {
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

	layout_angle_ofFork(angle_ofFork: number) {
		const fork_raw_radius = k.thickness.ring_rotation * 0.6;
		this.fork_radius = fork_raw_radius - this.fork_backoff;
		this.fork_backoff = this.fork_adjustment(fork_raw_radius, this.inside_arc_radius);
		this.angle_ofFork = angle_ofFork;
	}

	fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(angle));
		return delta / Math.sqrt(1.5);
	}

	finalize_angles() {
		if (!this.fork_pointsRight) {
			const saved = this.start_angle;
			this.start_angle = this.end_angle;
			this.end_angle = saved;
		}
		this.arc_rect = this.computed_arc_rect;
	}

	static readonly SVG_PATHS: unique symbol;

	get svgPathFor_arcSlider(): string {
		const start = this.start_angle;
		const end = this.end_angle;
		const paths = [
			this.svgPathFor_start(start, this.outside_arc_radius),
			this.svgPathFor_arcSliderEdge(end, this.outside_arc_radius, false),
			this.svgPathFor_cap(end, false),
			this.svgPathFor_arcSliderEdge(start, this.inside_arc_radius, true),
			this.svgPathFor_cap(start, true),
		];
		return paths.join(k.space);
	}

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
		const end_angle = clockwise ? arc_angle : (arc_angle + Math.PI).angle_normalized();
		return svgPaths.arc_partial(center, this.cap_radius, 0, 1, end_angle);
	}

	svgPathFor_tinyDot(radius: number, basis_angle: number) {
		const start = this.clusters_center.offsetBy(Point.fromPolar(radius, basis_angle));
		return svgPaths.circle(start, 5);
	}

	get svgPathFor_radialFork(): string {
		return svgPaths.line_atAngle(this.clusters_center, this.inside_arc_radius, this.angle_ofCenter);
	}

	// not used yet

	get svgPathFor_forkArc(): string {
		const angle = -this.angle_ofFork;
		const fork_radius = this.fork_radius;
		const forward = this.fork_slantsForward;
		const y = fork_radius * (forward ? -1 : 1);
		const x = this.inside_arc_radius - fork_radius - this.fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(this.clusters_center), fork_radius, 1,
			angle + (forward ? Angle.quarter : 0),
			angle - (forward ? 0 : Angle.quarter));
	}

}