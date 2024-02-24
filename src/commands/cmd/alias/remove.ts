import { Args, Command } from '@oclif/core';
import { readAliasFile, saveAliasFile } from '../../../utils';

export class CmdAliasRemove extends Command {
  public static args = {
    alias: Args.string({
      description: 'alias',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(CmdAliasRemove);

    const aliases = await readAliasFile(this.config);

    if (!aliases[args.alias]) {
      this.error(`"${args.alias}" is not an alias.`);
    }

    delete aliases[args.alias];

    await saveAliasFile(this.config, aliases);

    this.log('Successfully removed the alias!');
  }
}
