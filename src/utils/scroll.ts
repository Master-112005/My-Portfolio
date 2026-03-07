import { useScroll } from "framer-motion";
import { useRef } from "react";

export type Point2D = {
  x: number;
  y: number;
};

export type BezierSegment2D = {
  controlA: Point2D;
  controlB: Point2D;
  end: Point2D;
  start: Point2D;
};

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  if (inMax === inMin) {
    return outMin;
  }

  const progress = clamp((value - inMin) / (inMax - inMin));
  return lerp(outMin, outMax, progress);
}

export function interpolatePathPoint(progress: number, points: Point2D[]): Point2D {
  if (!points.length) {
    return { x: 0, y: 0 };
  }

  if (points.length === 1) {
    return points[0];
  }

  const clampedProgress = clamp(progress);
  const scaled = clampedProgress * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const localProgress = scaled - index;
  const start = points[index];
  const end = points[index + 1];

  return {
    x: lerp(start.x, end.x, localProgress),
    y: lerp(start.y, end.y, localProgress),
  };
}

export function cubicBezierPoint(progress: number, segment: BezierSegment2D): Point2D {
  const t = clamp(progress);
  const inv = 1 - t;

  return {
    x:
      inv * inv * inv * segment.start.x +
      3 * inv * inv * t * segment.controlA.x +
      3 * inv * t * t * segment.controlB.x +
      t * t * t * segment.end.x,
    y:
      inv * inv * inv * segment.start.y +
      3 * inv * inv * t * segment.controlA.y +
      3 * inv * t * t * segment.controlB.y +
      t * t * t * segment.end.y,
  };
}

export function sampleBezierSegments(segments: BezierSegment2D[], stepsPerSegment = 18) {
  if (!segments.length) {
    return [];
  }

  const samples: Point2D[] = [segments[0].start];

  segments.forEach((segment, segmentIndex) => {
    for (let step = 1; step <= stepsPerSegment; step += 1) {
      const point = cubicBezierPoint(step / stepsPerSegment, segment);

      if (segmentIndex < segments.length - 1 || step < stepsPerSegment) {
        samples.push(point);
      } else {
        samples.push(segment.end);
      }
    }
  });

  return samples;
}

export function useElementScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return {
    ref,
    scrollYProgress,
  };
}
