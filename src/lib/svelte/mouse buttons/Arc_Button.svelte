<script lang='ts'>

	function main_svgPaths(): Array<string> {
		const angle_leansForward = new Angle(fork_angle).angle_leansForward;
		const big_inner_svgPath = big_svgPath(inside_arc_radius, angle_leansForward);
		return [big_inner_svgPath];
	}

	function outer_svgPaths(): Array<string> {
		const angle_leansForward = new Angle(fork_angle).angle_leansForward;
		const big_outer_svgPath = big_svgPath(outside_arc_radius, angle_leansForward);
		const end_small_svgPath = small_svgPath(end_angle, angle_leansForward, false);
		const start_small_svgPath = small_svgPath(start_angle, angle_leansForward, true);
		return [start_small_svgPath, big_outer_svgPath, end_small_svgPath];
	}

	function big_svgPath(radius: number, angle_leansForward: boolean) {
		return svgPaths.arc(clusters_center, radius, 1, 
			angle_leansForward ? end_angle : start_angle,
			angle_leansForward ? start_angle : end_angle);
	}

	function fork_adjustment(fork_radius: number, inside_arc_radius: number): number {
		const ratio = fork_radius / inside_arc_radius / 2;
		const fork_angle = Math.asin(ratio) * 2;
		const delta = inside_arc_radius * (1 - Math.cos(fork_angle));
		return delta / Math.sqrt(1.5);
	}

	function fork_svgPath(forwards: boolean) {
		const fork_radius = fork_radius;
		const angle = -fork_angle;
		const y = fork_radius * (forwards ? -1 : 1);
		const x = inside_arc_radius - fork_radius - fork_backoff;
		const origin = new Point(x, y).rotate_by(angle);
		return svgPaths.arc(origin.offsetBy(clusters_center), fork_radius, 1,
			angle + (forwards ? Angle.quarter : 0),
			angle - (forwards ? 0 : Angle.quarter));
	}

	function small_svgPath(arc_angle: number, tiltsUp: boolean, advance: boolean) {
		const center = Point.square(outside_ring_radius);
		const small_arc_radius = k.ring_thickness / 6;
		const clockwise = tiltsUp == advance;
		const ratio = clockwise ? -1 : 1;
		const distanceTo_small_arc_center = inside_arc_radius + small_arc_radius;
		const small_arc_angle_start = (arc_angle + (Math.PI * ratio)).normalized_angle();
		const small_arc_angle_end = (arc_angle + (Math.PI * (ratio - 1))).normalized_angle();
		const small_arc_center = center.offsetBy(Point.fromPolar(distanceTo_small_arc_center, arc_angle));
		return svgPaths.arc(small_arc_center, small_arc_radius, clockwise ? 0 : 1, small_arc_angle_start, small_arc_angle_end);
	}

</script>