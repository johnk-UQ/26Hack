/** @param {boolean} prefersReducedMotion */
export function getScrollBehavior(prefersReducedMotion) {
  return prefersReducedMotion ? "auto" : "smooth";
}
