export async function resolve(specifier, context, next) {
  if (specifier === "@elixir/sdk/v1") return { url: new URL("./sdk.mjs", import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
