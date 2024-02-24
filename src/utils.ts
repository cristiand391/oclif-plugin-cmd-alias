import { Config } from '@oclif/core';
import { Interfaces } from '@oclif/core';
import * as path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

export type JSON = { [k: string]: string | undefined };

export async function readAliasFile(
  config: Config | Interfaces.Config,
): Promise<JSON> {
  const aliasFile = path.join(
    config.home,
    '.config',
    config.bin,
    'cmd-aliases.json',
  );

  try {
    return JSON.parse(await readFile(aliasFile, 'utf8'));
  } catch (err) {
    const error = err as Error;
    if (error.name.includes('ENOENT')) {
      // file doesn't exists, assign empty object
      return {};
    }
    throw err;
  }
}

export async function saveAliasFile(
  config: Config,
  content: JSON,
): Promise<void> {
  const aliasFile = path.join(
    config.home,
    '.config',
    config.bin,
    'cmd-aliases.json',
  );

  return writeFile(aliasFile, JSON.stringify(content, null, 2));
}
