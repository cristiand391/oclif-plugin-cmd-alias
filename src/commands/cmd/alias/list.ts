import { Command } from '@oclif/core';
import { EOL } from 'node:os';
import { readAliasFile } from '../../../utils';

export class CmdAliasList extends Command {
  async run(): Promise<void> {
    const aliases = await readAliasFile(this.config);

    let output = '';
    for (const key of Object.keys(aliases)) {
      output += `${key}: ${aliases[key]}${EOL}`;
    }

    this.log(output.slice(0, -1));
  }
}
