import gsap from "gsap";

export function pressIn(target, scale = 0.96) {
  gsap.to(target, {
    scale,
    duration: 0.14,
    ease: "power2.out",
    overwrite: true,
  });
}

export function pressOut(target, scale = 1) {
  gsap.to(target, {
    scale,
    duration: 0.24,
    ease: "elastic.out(1, 0.55)",
    overwrite: true,
  });
}

export function hoverIn(target) {
  gsap.to(target, {
    y: -2,
    scale: 1.025,
    duration: 0.24,
    ease: "power3.out",
    overwrite: true,
  });
}

export function hoverOut(target) {
  gsap.to(target, {
    y: 0,
    scale: 1,
    duration: 0.28,
    ease: "power3.out",
    overwrite: true,
  });
}
