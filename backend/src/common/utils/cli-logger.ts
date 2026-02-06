import { format } from 'node:util';

const writeLine = (stream: NodeJS.WriteStream, ...values: unknown[]) => {
  stream.write(`${format(...values)}\n`);
};

export const log = (...values: unknown[]) => writeLine(process.stdout, ...values);
export const logError = (...values: unknown[]) => writeLine(process.stderr, ...values);
