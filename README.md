# oclif-plugin-cmd-alias

This plugin should be considered as a POC for git-like command aliases in oclif.

Check:
* https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases
* https://cli.github.com/manual/gh_alias

## Installation:

```
<cli> plugins install @cristiand391/oclif-plugin-cmd-alias
```

## How it works
This plugin implements an [`init` hook](https://oclif.io/docs/hooks#lifecycle-events) that intercepts command executions, if it detects the command you are trying to run is not a core command then it looks for a valid alias and executes it if it's found.
There's two types of aliases:

### Core
These are CLI commands (either core commands or from 3rd party plugins) and are executed internally via [`this.config.runCommand`](https://oclif.io/docs/running_programmatically/#calling-commands-directly).
You can set these any command and valid flags.

Example:
Salesforce CLI (which includes @oclif/plugin-plugins)

To inspect a plugin you run something like:
```
➜  sf plugins inspect @salesforce/plugin-data
└─ @salesforce/plugin-data
   ├─ version 3.1.1
...
```

Now you can alias the `plugins inspect` command to `pi`:
```
➜  sf cmd alias add pi 'plugins:inspect $1'
Successfully added alias!

➜  sf pi @salesforce/plugin-data
└─ @salesforce/plugin-data
   ├─ version 3.1.1
```

Aliases accept positional placeholders like `$1`, `$2` and so that will be inserted appropriately at runtime.


Once placeholders are resolved, everything else will be passed down to the alias, here we pass the `--json` flag to the `pi` alias
```
➜  sf pi @salesforce/plugin-data --json
└─ @salesforce/plugin-data
[
  {
    "options": {
      "name": "@salesforce/plugin-data",
...

```

> [!NOTE]  
> When adding core aliases with `cmd alias add` make sure to use colons-separated commands in the expansion value. Even if your CLI supports set space as the topic separator, this plugin requires colon sep to be able to parse them. This could be fixed once I find how to extract a command ID from a string :)


### External
Unlike core aliases, these can call any available CLI locally because they are executed by calling node's [`child_process.exec`](https://nodejs.org/dist/latest-v20.x/docs/api/child_process.html#child_processexeccommand-options-callback).
You can use these to build new commands by composing multiple tools like `jq`, `gum`, etc.

Example:
Salesforce CLI (which includes @oclif/plugin-plugins)

Create a `p-cmd` command that returns commands from a plugin, this combines the `plugins inspect` command and `jq`:
```
➜  sf cmd alias add p-cmd '!sf plugins:inspect $1 --json | jq ".[].commandIDs"'
Successfully added alias!

➜  sf p-cmd data
[
  "data:create:record",
  "data:delete:bulk",
  "data:delete:record",
  "data:delete:resume",
  "data:export:beta:tree",
  "data:export:tree",
  "data:get:record",
  "data:import:beta:tree",
  "data:import:tree",
  "data:query",
  "data:query:resume",
  "data:resume",
  "data:update:record",
  "data:upsert:bulk",
  "data:upsert:resume",
  "force:data:bulk:delete",
  "force:data:bulk:status",
  "force:data:bulk:upsert"
]
```


For both type of aliases the hook calls `process.exit` to finish the process after the alias was executed, this is required because just returning here would let oclif execution continue (it will try to run the current args as a command and fail).

## Credits
Most of the code and design is a port of GitHub CLI's alias implementation https://github.com/cli/cli
