import { Args, Command } from '@oclif/core';
import { readAliasFile, saveAliasFile } from '../../../utils';

export class CmdAliasAdd extends Command {
  public static args = {
    alias: Args.string({
      description: 'alias',
      required: true,
    }),

    expansion: Args.string({
      description: 'expansion',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(CmdAliasAdd);

    const aliases = await readAliasFile(this.config);

    if (aliases[args.alias]) {
      this.error(`An alias named "${args.alias}" already exists.`);
    }
    aliases[args.alias] = args.expansion;

    await saveAliasFile(this.config, aliases);

    this.log('Successfully added alias!');
  }
}
