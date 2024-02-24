import { Hook } from '@oclif/core';
import { CLIError } from '@oclif/core/lib/errors/errors/cli';
import * as util from 'node:util';
import { readAliasFile } from '../../utils';
import { exec as execChildProcess } from 'node:child_process';

const exec = util.promisify(execChildProcess);

function expandAlias(expansion: string, args: string[]): string {
  const extraArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (!expansion.includes('$')) {
      extraArgs.push(args[i]);
      expansion = expansion += ` ${args[i]}`;
    } else {
      expansion = expansion.replace(`$${i + 1}`, args[i]);
    }
  }

  if (/\$\d/.test(expansion)) {
    throw new Error('Missing arguments');
  }

  return expansion;
}

const hook: Hook<'init'> = async function (opts) {
  // core command, return to continue execution.
  if (!opts.id || opts.config.findCommand(opts.id)) return;
  this.config.plugins.delete('@oclif/plugin-not-found');

  const aliases = await readAliasFile(opts.config);

  /* 
  `opts.id` is a colon-separated string of possible cmd parts (ignoring flags).
  Example:

  $ cli foo bar
  opts.id === 'foo:bar'

  $ cli foo bar --json
  opts.id === 'foo:bar'
  */

  const aliasSplit = opts.id.split(':');

  const aliasName = aliasSplit[0];

  const aliasValue = aliases[aliasName];

  // not an alias, return.
  if (aliasValue === undefined) return;

  if (aliasValue.startsWith('!')) {
    // this is a shell expression
    try {
      // the alias is the first word in `aliasSplit`, everything else after it are args.
      const args = process.argv.slice(3);
      const expandedAlias = expandAlias(aliasValue, args);

      const { stdout } = await exec(expandedAlias.replace('!', ''));
      // strip newline char from stdout
      console.log(stdout.slice(0, -1));
      process.exit(0);
    } catch (err) {
      switch ((err as Error).message) {
        case 'Missing arguments':
          this.log(
            `Unable to expand \`${aliasName}\` alias due to missing arguments`,
          );
          break;
        default:
          console.error(err);
      }
      // @ts-expect-error err.code is set by child_process:
      // https://github.com/nodejs/node/blob/9448c61e087dad0c8aaed9608aa2616f11269922/lib/child_process.js#L423
      process.exit(err.code ?? 1);
    }
  } else {
    // alias
    try {
      const resolveAlias = (alias: string): [string, string[] | undefined] => {
        const i = alias.indexOf(' ');
        if (i === -1) return [alias, process.argv.slice(3)];

        const cmdId = alias.slice(0, i);
        const args = expandAlias(
          alias.slice(i + 1),
          process.argv.slice(3),
        ).split(' ');

        return [cmdId, args];
      };

      const [cmdId, args] = resolveAlias(aliasValue);
      await this.config.runCommand(cmdId, args);
      process.exit(process.exitCode ?? 0);
    } catch (err) {
      // oclif error, grab the exit code from it.
      if (err instanceof CLIError) {
        process.exit(err.oclif.exit ?? 1);
      }

      switch ((err as Error).message) {
        case 'Missing arguments':
          this.log(
            `Unable to expand \`${aliasName}\` alias due to missing arguments`,
          );
          break;
        default:
          console.error(err);
      }
      process.exit(process.exitCode ?? 1);
    }
  }
};
export default hook;
