import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import portalImg from "../assets/Portal.png";
import manImg from "../assets/man.png";

export default function PortalScene({
  leftOffset = 0,
  wrapperSize = 300,
  manWidth = 220,
  spinDuration = 6,
  onChooseFile,
}) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      rotate: 360,
      transition: {
        repeat: Infinity,
        ease: "linear",
        duration: spinDuration,
      },
    });
  }, [controls, spinDuration]);

  /** ORIGINAL SIZES RESTORED */
  const bigSize = wrapperSize;
  const mediumSize = Math.round(wrapperSize / 1.3);
  const tinySize = Math.round(wrapperSize * 0.15);

  const centerPos = (size) => {
    const offset = Math.round((wrapperSize - size) / 2);
    return { top: offset, left: offset };
  };

  return (
    <div
      style={{
        width: "100%",
        background: "white",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginLeft: `${leftOffset}px`,
        paddingTop: "10px",
        paddingBottom: "10px",
      }}
    >
      {/* CLICKABLE SPINNING PORTAL */}
      <div
        onClick={onChooseFile}
        style={{
          position: "relative",
          width: wrapperSize,
          height: wrapperSize,
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        {/* TINY */}
        <motion.img
          src={portalImg}
          animate={controls}
          alt="tiny portal"
          style={{
            position: "absolute",
            width: tinySize,
            height: tinySize,
            ...centerPos(tinySize),
            transformOrigin: "50% 50%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* MEDIUM */}
        <motion.img
          src={portalImg}
          animate={controls}
          alt="medium portal"
          style={{
            position: "absolute",
            width: mediumSize,
            height: mediumSize,
            ...centerPos(mediumSize),
            transformOrigin: "50% 50%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        {/* LARGE */}
        <motion.img
          src={portalImg}
          animate={controls}
          alt="large portal"
          style={{
            position: "absolute",
            width: bigSize,
            height: bigSize,
            ...centerPos(bigSize),
            transformOrigin: "50% 50%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      </div>

      {/* MAN — NOT CLICKABLE */}
      <img
        src={manImg}
        alt="man"
        style={{
          width: manWidth,
          height: "auto",
          marginLeft: manWidth * 0.15,
          objectFit: "contain",
          zIndex: 30,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
