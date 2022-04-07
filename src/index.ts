export * from "./engine";

if (process.env.NODE_ENV === "development") {
  async function main() {
    const engine = await (await import("./engine")).factory();
    await engine.init();
  }
  main();
}
