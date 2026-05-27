"use client";

import Image from "next/image";
import { animate, motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useEditMode } from "@/admin/EditMode";
import type { ProfileData } from "@/lib/types";
import { clampMotionValue, createBadgeSwingImpulse, hangingBadgePhysics } from "@/utils/animations";

type IDCardProps = {
  profile: ProfileData;
};

const RAD_TO_DEG = 57.2958;
const BASE_TILT_X = 2;
const BASE_TILT_Y = -7;

export default function IDCard({ profile }: IDCardProps) {
  const { requestUnlock } = useEditMode();
  const cardRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const ignoreClickRef = useRef(false);
  const pointerBiasRef = useRef(0);
  const settleControlsRef = useRef<{ stop: () => void } | null>(null);
  const swingStateRef = useRef({
    angle: 0,
    velocity: 0,
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const serialNumber = profile.idCard.serialNumber.trim();
  const primaryName = profile.idCard.primaryName.trim();
  const secondaryName = profile.idCard.secondaryName.trim();
  const roleLines = profile.idCard.frontRoleLines.map((line) => line.trim()).filter(Boolean);
  const backTitle = profile.idCard.backTitle.trim();
  const imageSrc = profile.profileImageSrc.trim();
  const isInlineImage = imageSrc.startsWith("data:");
  const backDescription = profile.idCard.backDescription.trim();
  const backFooter = profile.idCard.backFooter.trim();

  const pullY = useMotionValue(0);
  const swingDegrees = useMotionValue(0);
  const tiltX = useSpring(BASE_TILT_X, hangingBadgePhysics.tilt);
  const tiltY = useSpring(BASE_TILT_Y, hangingBadgePhysics.tilt);
  const badgeRotateZ = useTransform(() =>
    clampMotionValue(
      swingDegrees.get() + pullY.get() * 0.024,
      -hangingBadgePhysics.maxSwing,
      hangingBadgePhysics.maxSwing,
    ),
  );
  const clipRotateZ = useTransform(() => badgeRotateZ.get() * 0.22);
  const strapHeight = useTransform(
    pullY,
    [0, hangingBadgePhysics.dragLimit],
    [hangingBadgePhysics.strapBaseHeight, hangingBadgePhysics.strapBaseHeight + hangingBadgePhysics.dragLimit],
  );
  const strapTension = useTransform(pullY, [0, hangingBadgePhysics.dragLimit], [1, 0.96]);
  const shadowX = useTransform(() => badgeRotateZ.get() * 1.35 + tiltY.get() * 0.28);
  const shadowY = useTransform(pullY, [0, hangingBadgePhysics.dragLimit], [0, hangingBadgePhysics.dragLimit * 0.3]);
  const shadowScaleX = useTransform(() => 1 + pullY.get() * 0.00045 + Math.abs(badgeRotateZ.get()) * 0.012);
  const shadowScaleY = useTransform(() => 1 + pullY.get() * 0.00018);
  const shadowOpacity = useTransform(() => 0.16 + pullY.get() * 0.00042 + Math.abs(badgeRotateZ.get()) * 0.004);

  const resetTilt = () => {
    tiltX.set(BASE_TILT_X);
    tiltY.set(BASE_TILT_Y);
  };

  const stopSettleAnimation = () => {
    settleControlsRef.current?.stop();
    settleControlsRef.current = null;
  };

  const impartSwing = (impulse: number) => {
    swingStateRef.current.velocity = clampMotionValue(
      swingStateRef.current.velocity + impulse * hangingBadgePhysics.swing.inertia,
      -2.9,
      2.9,
    );
  };

  useAnimationFrame((_, delta) => {
    if (draggingRef.current) {
      return;
    }

    const step = Math.min(delta / 1000, 0.032);
    const swingState = swingStateRef.current;
    const angularAcceleration =
      (-hangingBadgePhysics.swing.stiffness * swingState.angle -
        hangingBadgePhysics.swing.damping * swingState.velocity) /
      hangingBadgePhysics.swing.mass;

    swingState.velocity += angularAcceleration * step;
    swingState.angle += swingState.velocity * step;

    if (Math.abs(swingState.angle) < 0.00008 && Math.abs(swingState.velocity) < 0.00008) {
      swingState.angle = 0;
      swingState.velocity = 0;
    }

    swingDegrees.set(
      clampMotionValue(
        swingState.angle * RAD_TO_DEG,
        -hangingBadgePhysics.maxSwing,
        hangingBadgePhysics.maxSwing,
      ),
    );
  });

  useEffect(() => {
    return () => {
      stopSettleAnimation();
    };
  }, []);

  return (
    <div className="relative mx-auto flex h-[40rem] w-full max-w-[20rem] items-start justify-center pt-2 sm:h-[42rem]">
      <motion.div
        style={{
          x: shadowX,
          y: shadowY,
          scaleX: shadowScaleX,
          scaleY: shadowScaleY,
          opacity: shadowOpacity,
        }}
        className="pointer-events-none absolute bottom-8 left-1/2 h-10 w-48 -translate-x-1/2 rounded-full bg-black/22 blur-2xl"
      />

      <div className="absolute left-1/2 top-0 z-30 flex -translate-x-1/2 flex-col items-center">
        <div className="h-14 w-4 rounded-b-full bg-[#090909] shadow-[0_10px_18px_rgba(0,0,0,0.28)]" />
        <div className="-mt-1 h-9 w-9 rounded-full border-[4px] border-[#0b0b0b] border-b-transparent bg-transparent" />
      </div>

      <motion.div
        className="relative h-full w-full [perspective:1800px]"
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          rotateZ: badgeRotateZ,
          transformOrigin: "50% 0%",
        }}
      >
        <motion.div
          style={{ height: strapHeight, scaleX: strapTension }}
          className="absolute left-1/2 top-8 z-10 w-16 -translate-x-1/2 origin-top"
        >
          <div className="absolute left-1/2 top-0 h-full w-[0.22rem] -translate-x-1/2 rounded-b-full bg-[linear-gradient(180deg,#050505,#171717)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]" />
          <div className="absolute left-1/2 top-0 h-full w-[0.34rem] -translate-x-[180%] rounded-b-full bg-[linear-gradient(180deg,#121212,#2b2b2b)]" />
          <div className="absolute left-1/2 top-0 h-full w-[0.34rem] translate-x-[80%] rounded-b-full bg-[linear-gradient(180deg,#121212,#2b2b2b)]" />
        </motion.div>

        <motion.div
          style={{ rotateZ: clipRotateZ }}
          className="pointer-events-none absolute left-1/2 top-[7.1rem] z-20 h-12 w-[3.6rem] -translate-x-1/2"
        >
          <div className="absolute left-1/2 top-0 h-4 w-10 -translate-x-1/2 rounded-full bg-[#0b0b0b]" />
          <div className="absolute left-1/2 top-3 h-6 w-[2.1rem] -translate-x-1/2 rounded-b-[1rem] rounded-t-[0.6rem] bg-[linear-gradient(180deg,#3d3d3d,#111111)] shadow-[0_10px_18px_rgba(0,0,0,0.18)]" />
        </motion.div>

        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: hangingBadgePhysics.dragLimit }}
          dragElastic={0.14}
          dragMomentum={false}
          style={{ y: pullY }}
          onHoverStart={() => {
            setIsHovered(true);
            impartSwing(swingStateRef.current.velocity === 0 ? -0.95 : -0.35);
          }}
          onHoverEnd={() => {
            setIsHovered(false);
            resetTilt();
          }}
          onPointerMove={(event) => {
            const bounds = cardRef.current?.getBoundingClientRect();

            if (!bounds) {
              return;
            }

            const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
            const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
            const normalizedX = clampMotionValue(offsetX * 2, -1, 1);
            const normalizedY = clampMotionValue(offsetY * 2, -1, 1);

            pointerBiasRef.current = normalizedX;
            tiltY.set(BASE_TILT_Y + normalizedX * 7);
            tiltX.set(BASE_TILT_X + normalizedY * -6);

            if (isHovered && !draggingRef.current) {
              swingStateRef.current.velocity = clampMotionValue(
                swingStateRef.current.velocity + normalizedX * 0.006,
                -2.9,
                2.9,
              );
            }
          }}
          onClick={() => {
            if (ignoreClickRef.current) {
              return;
            }

            setIsFlipped((current) => !current);
          }}
          onDragStart={() => {
            draggingRef.current = true;
            stopSettleAnimation();
            swingStateRef.current.velocity *= 0.35;
          }}
          onDrag={(_, info) => {
            const dragProgress = clampMotionValue(info.offset.y / hangingBadgePhysics.dragLimit, 0, 1);
            swingStateRef.current.angle = clampMotionValue(pointerBiasRef.current * 0.04 + dragProgress * 0.025, -0.16, 0.16);
            swingStateRef.current.velocity *= 0.86;
            swingDegrees.set(
              clampMotionValue(
                swingStateRef.current.angle * RAD_TO_DEG,
                -hangingBadgePhysics.maxSwing,
                hangingBadgePhysics.maxSwing,
              ),
            );
          }}
          onDragEnd={(_, info) => {
            draggingRef.current = false;
            ignoreClickRef.current = Math.abs(info.offset.y) > 10;
            window.setTimeout(() => {
              ignoreClickRef.current = false;
            }, 180);

            settleControlsRef.current = animate(pullY, 0, {
              ...hangingBadgePhysics.release,
              velocity: info.velocity.y,
            });
            resetTilt();
            impartSwing(createBadgeSwingImpulse(info.velocity.y, pointerBiasRef.current));

            if (info.offset.y > hangingBadgePhysics.unlockThreshold) {
              requestUnlock();
            }
          }}
          className="absolute left-1/2 top-[6.7rem] z-30 w-[17rem] -translate-x-1/2 cursor-grab active:cursor-grabbing sm:w-[17.8rem]"
        >
          <div ref={cardRef} className="relative w-full [transform-style:preserve-3d]">
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="relative mt-8 h-[29rem] w-full rounded-[1.45rem] [transform-style:preserve-3d] sm:h-[30rem]"
            >
              <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15 bg-[linear-gradient(180deg,#1b1b1b,#060606)] shadow-[0_8px_16px_rgba(0,0,0,0.22)]">
                <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70" />
              </div>

              <div className="absolute inset-0 overflow-hidden rounded-[1.45rem] border border-black/10 bg-[linear-gradient(180deg,#f3f3f3_0%,#ececec_46%,#d9d9d9_100%)] text-[#141414] shadow-[0_34px_70px_rgba(0,0,0,0.22)] [backface-visibility:hidden]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_48%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.48),transparent_36%,rgba(0,0,0,0.06)_78%,rgba(255,255,255,0.18))]" />
                <div className="absolute left-1/2 top-0 h-[4.9rem] w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(9,9,9,0.72),rgba(9,9,9,0.08))]" />
                {serialNumber ? (
                  <>
                    <div className="absolute right-5 top-5 font-mono text-[0.8rem] tracking-[0.26em] text-black/52"># {serialNumber}</div>
                    <div className="absolute right-4 top-[3.95rem] h-px w-24 bg-black/26" />
                  </>
                ) : null}

                <div className="absolute left-[3.6rem] top-[3.2rem] h-28 w-px rotate-[38deg] bg-black/38" />
                <div className="absolute left-[12.4rem] top-[3.4rem] h-20 w-px rotate-[38deg] bg-black/32" />
                <div className="absolute left-[13.2rem] top-[3.9rem] h-20 w-px rotate-[38deg] bg-black/32" />

                <div className="relative flex h-full flex-col px-6 py-5">
                  <div className="relative z-10 pt-6">
                    {primaryName ? (
                      <p
                        className="text-[4.45rem] leading-[0.72] tracking-[-0.08em] text-black/82 sm:text-[4.8rem]"
                        style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
                      >
                        {primaryName}
                      </p>
                    ) : null}
                    {secondaryName ? (
                      <p
                        className="ml-[5.5rem] mt-8 text-[4.8rem] leading-[0.72] tracking-[-0.08em] text-black/78 sm:text-[5rem]"
                        style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
                      >
                        {secondaryName}
                      </p>
                    ) : null}
                  </div>

                  {imageSrc ? (
                    <div className="absolute bottom-0 left-0 z-0 h-[74%] w-[68%] overflow-hidden rounded-br-[2rem]">
                      <Image
                        src={imageSrc}
                        alt={profile.profileImageAlt}
                        fill
                        priority
                        sizes="(max-width: 640px) 280px, 320px"
                        unoptimized={isInlineImage}
                        className="object-cover object-left-top grayscale contrast-125 brightness-[0.92]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_22%,rgba(240,240,240,0.04)_36%,rgba(235,235,235,0.22)_100%)]" />
                      <div className="absolute inset-y-0 right-0 w-14 bg-[linear-gradient(90deg,transparent,rgba(236,236,236,0.84))]" />
                    </div>
                  ) : null}

                  {roleLines.length ? (
                    <div className="relative z-10 mt-auto flex justify-end">
                      <div className="w-[5.7rem] pr-1 text-right">
                        <p className="font-mono text-[1.4rem] tracking-[0.38em] text-black/64">ID</p>
                        <div className="mt-4 space-y-3 font-mono text-[1rem] uppercase tracking-[0.28em] text-black/68">
                          {roleLines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="absolute inset-0 overflow-hidden rounded-[1.45rem] border border-black/10 bg-[linear-gradient(180deg,#f5f5f5_0%,#ececec_100%)] px-6 py-5 text-[#141414] shadow-[0_34px_70px_rgba(0,0,0,0.22)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.68),transparent_38%,rgba(0,0,0,0.04)_100%)]" />
                <div className="absolute left-1/2 top-0 h-[4.9rem] w-[2px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(9,9,9,0.72),rgba(9,9,9,0.08))]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      {backTitle ? (
                        <p className="font-mono text-[0.72rem] uppercase tracking-[0.3em] text-black/46">{backTitle}</p>
                      ) : null}
                      {profile.name.trim() ? (
                        <h3 className="mt-3 text-[2.1rem] font-semibold tracking-[-0.06em] text-black/82">{profile.name}</h3>
                      ) : null}
                    </div>
                    {serialNumber ? (
                      <div className="font-mono text-[0.8rem] tracking-[0.26em] text-black/52">#{serialNumber}</div>
                    ) : null}
                  </div>

                  <div className="mt-8 space-y-3">
                    {profile.socialLinks.map((link) => (
                      <a
                        key={`${link.label}-${link.href}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center justify-between rounded-[1.1rem] border border-black/10 bg-white/50 px-4 py-3 transition hover:border-black/20 hover:bg-white/72"
                      >
                        <div>
                          <p className="text-sm font-semibold text-black/84">{link.label}</p>
                          <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-black/48">
                            {link.handle}
                          </p>
                        </div>
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-black/54">Open</span>
                      </a>
                    ))}
                  </div>

                  {backDescription ? (
                    <div className="mt-8 rounded-[1.2rem] border border-black/10 bg-white/44 px-4 py-4">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-black/44">Unlock gesture</p>
                      <p className="mt-3 text-sm leading-6 text-black/66">{backDescription}</p>
                    </div>
                  ) : null}

                  {backFooter ? (
                    <div className="mt-auto border-t border-black/10 pt-4 font-mono text-[0.72rem] uppercase tracking-[0.24em] text-black/42">
                      {backFooter}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
