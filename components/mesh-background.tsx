export function MeshBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute -left-40 top-16 h-[22rem] w-[22rem] rounded-full bg-primary/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-chart-2/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-chart-4/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0.02_264/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0.02_264/0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_20%,transparent_70%)]"
        aria-hidden
      />
    </>
  );
}
