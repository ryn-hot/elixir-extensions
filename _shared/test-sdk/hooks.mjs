// Node resolve hook: maps the runner SDK specifier to the test stand-in.
export async function resolve(specifier, context, next) {
  if (specifier === "@elixir/sdk/v1") {
    return { url: new URL("./v1.mjs", import.meta.url).href, shortCircuit: true };
  }
  return next(specifier, context);
}
