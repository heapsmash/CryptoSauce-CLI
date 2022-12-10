import { Logger } from 'tslog';
import chalk from 'chalk';

export class Log {
    log: any;
    constructor(logName: string) {
        this.log = new Logger({
            name: chalk`{rgb(142,50,229) ${logName}}`,
            stylePrettyLogs: true,
            prettyLogTemplate: '{{logLevelName}} [{{name}}]',
            prettyLogStyles: {
                logLevelName: {
                    '*': ['bold', 'black', 'bgWhiteBright', 'dim'],
                    SILLY: ['bold', 'white'],
                    TRACE: ['bold', 'whiteBright'],
                    DEBUG: ['bold', 'green'],
                    INFO: ['bold', 'cyanBright'],
                    WARN: ['bold', 'yellow'],
                    ERROR: ['bold', 'red'],
                    FATAL: ['bold', 'redBright'],
                },
            },
        });
    }

    public info = (...args: string[]) => {
        this.log.info(chalk.cyanBright(args.join(' ')));
    };

    public warn = (...args: string[]) => {
        this.log.warn(chalk.yellowBright(args.join(' ')));
    };

    public error = (...args: string[]) => {
        this.log.error(chalk.redBright(args.join(' ')));
    };

    public debug = (...args: string[]) => {
        this.log.debug(chalk.greenBright(args.join(' ')));
    };
}
