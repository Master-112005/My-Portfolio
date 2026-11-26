export const hangingBadgePhysics = {
    dragLimit: 160,
    maxSwing: 14,
    strapBaseHeight: 108,
    unlockThreshold: 116,
    swing: {
        stiffness: 30,
        damping: 8,
        mass: 1.08,
        inertia: 0.96,
    },
    tilt: {
        stiffness: 210,
        damping: 20,
        mass: 0.82,
    },
    release: {
        type: "spring",
        stiffness: 220,
        damping: 16,
        mass: 0.88,
    },
};
export const easeOutTransition = {
    duration: 0.7,
    ease: [0.22, 1, 0.36, 1],
};
export const fadeUpVariant = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: easeOutTransition },
};
export const staggerParentVariant = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};
export function clampMotionValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
export function createBadgeSwingImpulse(velocityY, pointerBias) {
    const velocityImpulse = clampMotionValue(velocityY / 1400, -1.9, 2.25);
    const pointerImpulse = clampMotionValue(pointerBias * 0.95, -0.85, 0.85);
    return clampMotionValue(velocityImpulse + pointerImpulse, -2.4, 2.6);
}
