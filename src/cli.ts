#!/usr/bin/env node

import { encryptFile, decryptFile } from './crypto-generator';
import * as cliProgress from 'cli-progress';
import { Command } from 'commander';
import readline from 'readline';
import { Log } from './logger';
import chalk from 'chalk';
import * as fs from 'fs';
import md5 from 'md5';

type RtHack = {
    _writeToOutput: (stringToWrite: string) => void
} & readline.Interface

const log = new Log('CryptoSauce');
const stdin = process.stdin;
const stdout = process.stdout;
const program = new Command();
const progressBar = new cliProgress.SingleBar(
    {
        format: 'CryptoSauce Progress |' + chalk.cyanBright('{bar}') + '| {percentage}% || {value}/{total}',
    },
    cliProgress.Presets.rect
);

/* ------------------------------------------------------------------------- */
const updateProgressBar = (status: string, progress: number, total: number) => {
    if (status == 'start') {
        progressBar.start(total, 0);
    } else if (status == 'update') {
        progressBar.update(progress);
    } else if (status == 'done') {
        progressBar.stop();
    }
};

/* ------------------------------------------------------------------------- */
const passwordPrompt = (query: string) => {
    let password = '';
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const retval = new Promise((resolve) =>
        rl.question(query, (answer: unknown) => {
            rl.close();
            resolve(answer);
        })
    );

    stdin.resume();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const promptHandler = (ch: any) => {
        // ch.split('').map((c) => {log.info(c.charCodeAt(0))})
        switch (ch.toString('utf-8')) {
            case '\n':
            case '\r':
            case '\u0004':
                // They've finished typing their password
                process.stdout.write('\n');
                stdin.setRawMode(false);
                stdin.pause();
                stdin.removeListener('data', promptHandler);
                break;
            case '\u0003':
                // Ctrl-C
                stdin.removeListener('data', promptHandler);
                break;
            case '\u0008':
            case '\u007F':
                // backspace for Windows, Linux, and MacOS
                password = password.slice(0, password.length - 1);
                stdout.clearLine(-1);
                stdout.cursorTo(0);
                stdout.write(query);
                stdout.write(
                    password
                        .split('')
                        .map(() => {
                            return '*';
                        })
                        .join('')
                );
                break;
            default:
                // check for a bunch of special key strokes (delete, arrows, etc.)
                if (ch.length > 1 && ch[0] == '\u001B' && ch[1] == '\u005B') {
                    break;
                }
                // More passsword characters
                const dots = new Array(ch.length + 1).join('*');
                stdout.write(dots);
                password += ch;
                break;
        }
    };
    stdin.on('data', promptHandler);

    // We have to override this or it mangles our output. And casting as 'RtHack'
    // is a workaround b/c typescript doesn't see the dunder method in readline.Interface
    (rl as RtHack)._writeToOutput = (stringToWrite: string) => {};

    return retval;
};

/* ------------------------------------------------------------------------- */
const encryptoSauceFile = async (infile: string, out: string | undefined, remove: boolean | undefined) => {
    try {
        let getPW = true;
        let password = '';
        const outfile = out ? out : `${infile}.crypt`;

        while (getPW) {
            const pw1 = (await passwordPrompt('Enter a password: ')) as string;
            const pw2 = (await passwordPrompt('Re-enter your password: ')) as string;

            if (pw1 == pw2 && pw1.trim()) {
                password = pw1;
                getPW = false;
            } else {
                log.warn('Your passwords did not match OR were empty, try again.');
            }
        }
        const error = await encryptFile(md5(password), infile, outfile, updateProgressBar);
        if (error) {
            log.error(error as string);
            return;
        }
        log.info(`'${infile}' is now encrypted at '${outfile}'`);
        if (remove) {
            removeFile(infile);
        }
    } catch (error) {
        log.error(error);
    }
};

/* ------------------------------------------------------------------------- */
const decryptoSauceFile = async (infile: string, out: string | undefined, remove: boolean | undefined) => {
    try {
        const ext = infile.slice(infile.length - 6, infile.length);
        const outfile = out ? out : ext == '.crypt' ? `${infile.slice(0, infile.length - 6)}` : `${infile}.decrypt`;
        const password = (await passwordPrompt('Enter a password: ')) as string;
        const error = await decryptFile(md5(password), infile, outfile, updateProgressBar);

        if (error) {
            log.error(error as string);
            return;
        }
        log.info(`'${infile}' is now decrypted at '${outfile}'`);
        if (remove) {
            removeFile(infile);
        }
    } catch (error) {
        log.error(error);
        throw error;
    }
};

/* ------------------------------------------------------------------------- */
const validateOptions = (options: { [key: string]: any }) => {
    const { decrypt, encrypt, infile, outfile } = options;
    if ((decrypt && encrypt) || (!decrypt && !encrypt) || !infile) {
        return false;
    } else if (!infile.trim() || (outfile && !outfile.trim())) {
        return false;
    }

    return true;
};

/* ------------------------------------------------------------------------- */
const removeFile = (rfile: string) => {
    fs.unlink(rfile, (err) => {
        if (err) {
            log.error(`error when trying to remove '${rfile}'`);
            throw err;
        }
    });

    log.info(`'${rfile}' was removed`);
};

/* ------------------------------------------------------------------------- */
const main = async () => {
    program.option('-d, --decrypt', 'flag to decrypt');
    program.option('-e, --encrypt', 'flag to encrypt');
    program.option('-i, --infile <type>', 'input file to decrypt/encrypt');
    program.option('-o, --outfile <type>', 'output file of encryption');
    program.option('-r, --remove', 'include this flag to remove orignal file after encrypt/decrypt');
    program.parse(process.argv);
    const options = program.opts();

    if (!validateOptions(options)) {
        log.error('Command options conflict, try again with corrected parameters');
        return;
    }

    log.info(
        `${options.encrypt ? 'Encrypting' : 'Decrypting'} with options:\n${JSON.stringify(options, undefined, 2)}`
    );
    if (options.encrypt) {
        await encryptoSauceFile(options.infile, options.outfile, options.remove);
    } else if (options.decrypt) {
        await decryptoSauceFile(options.infile, options.outfile, options.remove);
    }
};

main().then(() => log.info('Goodbye!'));

/* ------------------------------------------------------------------------- */
