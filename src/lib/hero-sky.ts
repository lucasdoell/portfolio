import type { NightSkyHandle } from "./night-sky";

const isNight = () => document.documentElement.dataset.theme === "dark";

/**
 * Runs the night sky behind the hero while the page is in night mode. The shader module (and vgpu)
 * only loads the first time night is shown, so day visitors never download it.
 */
export function mountHeroSky() {
  const region = document.querySelector<HTMLElement>("[data-sky-region]");
  const sky = region?.querySelector<HTMLElement>(".sky");
  const canvas = region?.querySelector<HTMLCanvasElement>("[data-night-sky]");
  const star = region?.querySelector<HTMLElement>("[data-polaris]");
  if (!region || !sky || !canvas) return;

  let handle: NightSkyHandle | undefined;
  let starting: Promise<void> | undefined;

  // Polaris in the shader sits on the star beside the name, wherever the layout put it.
  const polarisFraction = (): [number, number] => {
    if (!star) return [0.41, 0.675];
    const r = region.getBoundingClientRect();
    const s = star.getBoundingClientRect();
    return [(s.left + s.width / 2 - r.left) / r.width, (s.top + s.height / 2 - r.top) / r.height];
  };

  const start = () => {
    starting ??= (async () => {
      const { startNightSky } = await import("./night-sky");
      await document.fonts?.ready;
      const starSize = star?.getBoundingClientRect().width ?? 48;
      handle = await startNightSky(canvas, {
        polaris: polarisFraction(),
        showPolaris: false,
        haloRadius: Math.round(starSize * 3.1),
        onFallback: () => sky.setAttribute("data-fallback", ""),
      });
      handle.setPaused(!isNight());
    })().catch(() => sky.setAttribute("data-fallback", ""));
    return starting;
  };

  // The star moves when the region resizes and when the display fonts swap in.
  const remeasure = () => handle?.setPolaris(...polarisFraction());
  const ro = new ResizeObserver(remeasure);
  ro.observe(region);
  if (star?.parentElement) ro.observe(star.parentElement);
  document.fonts?.ready.then(remeasure);

  if (isNight()) start();
  document.addEventListener("themechange", () => {
    if (isNight()) {
      // The canvas was display:none; give layout a frame before the surface measures it.
      requestAnimationFrame(() => {
        if (handle) {
          handle.setPolaris(...polarisFraction());
          handle.setPaused(false);
        } else start();
      });
    } else handle?.setPaused(true);
  });
}
