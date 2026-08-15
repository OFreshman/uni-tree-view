const defaultPlaygroundPort = 9861;
const maximumDocsPort = 65534;

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > maximumDocsPort) {
    throw new Error(`Invalid docs port ${JSON.stringify(value)}. Expected an integer between 1 and ${maximumDocsPort}.`);
  }
  return port;
}

export function resolvePlaygroundPort(args: string[]): number {
  let requestedPort: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--port") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("`--port` requires a numeric value.");
      }
      requestedPort = parsePort(value);
      index += 1;
      continue;
    }

    if (argument.startsWith("--port=")) {
      requestedPort = parsePort(argument.slice("--port=".length));
    }
  }

  return requestedPort === undefined ? defaultPlaygroundPort : requestedPort + 1;
}