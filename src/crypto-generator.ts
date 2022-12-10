import * as crypto from 'crypto';
import * as fs from 'fs';

/* ------------------------------------------------------------------------- */
export const ALGORITHM = 'aes-256-cbc';
export const ENCODING = 'binary';
export const IV_LENGTH = 16;
export const BUFFER_SIZE = 65536;

/* ------------------------------------------------------------------------- */
export const encryptString = (cryptoSecret: string, data: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.alloc(32, cryptoSecret), iv);
    return Buffer.concat([cipher.update(data), cipher.final(), iv]).toString(ENCODING);
};

/* ------------------------------------------------------------------------- */
export const decryptString = (cryptoSecret: string, data: string): string => {
    const binaryData = Buffer.from(data, ENCODING);
    const iv = binaryData.slice(-IV_LENGTH);
    const encryptedData = binaryData.slice(0, binaryData.length - IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.alloc(32, cryptoSecret), iv);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString();
};

/* ------------------------------------------------------------------------- */
export const encryptFile = (
    cryptoSecret: string,
    infile: string,
    outfile: string,
    updateCallback: (status: string, progress: number, total: number) => void
) => {
    const outfileTmp = `${outfile}.${crypto.randomBytes(5).toString('hex')}`;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.alloc(32, cryptoSecret), iv);
    const inputFileStream = fs.createReadStream(infile);
    const outputFileStream = fs.createWriteStream(outfileTmp);

    const stats = fs.statSync(infile);
    const fileSizeInBytes = stats.size;
    let progressSize = 0;

    updateCallback('start', 0, fileSizeInBytes);
    outputFileStream.write(iv);
    cipher.setEncoding(ENCODING);

    inputFileStream.on('data', (data) => {
        // var percentage = parseInt(infile.bytesRead) / parseInt(size);
        const encrypted = cipher.update(data);
        if (encrypted) {
            progressSize += Buffer.byteLength(data);
            updateCallback('update', progressSize, fileSizeInBytes);
            outputFileStream.write(encrypted);
        }
    });

    const retval = new Promise((resolve) =>
        inputFileStream.on('end', () => {
            try {
                updateCallback('done', progressSize, fileSizeInBytes);
                outputFileStream.write(cipher.final());
                outputFileStream.close();
                fs.renameSync(outfileTmp, outfile);
                resolve(false);
            } catch (error) {
                fs.unlinkSync(outfileTmp);
                resolve((error as Error).message);
            }
        })
    );

    while (inputFileStream.read(BUFFER_SIZE) != null) {}
    return retval;
};

/* ------------------------------------------------------------------------- */
export const decryptFile = (
    cryptoSecret: string,
    infile: string,
    outfile: string,
    updateCallback: (status: string, progress: number, total: number) => void
) => {
    const outfileTmp = `${outfile}.${crypto.randomBytes(5).toString('hex')}`;

    // Open and read the IV, then close
    const fd = fs.openSync(infile, 'r');
    const ivBuf = Buffer.alloc(IV_LENGTH);
    fs.readSync(fd, ivBuf, 0, IV_LENGTH, 0);
    fs.closeSync(fd);

    const inputFileStream = fs.createReadStream(infile, { start: IV_LENGTH });
    const outputFileStream = fs.createWriteStream(outfileTmp);
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.alloc(32, cryptoSecret), ivBuf);

    const stats = fs.statSync(infile);
    const fileSizeInBytes = stats.size;
    let progressSize = IV_LENGTH;

    updateCallback('start', 0, fileSizeInBytes);
    decipher.setEncoding(ENCODING);
    inputFileStream.on('data', (data: Buffer) => {
        // var percentage = parseInt(infile.bytesRead) / parseInt(size);
        const decrypted = decipher.update(data.toString(ENCODING), ENCODING);
        if (decrypted) {
            progressSize += Buffer.byteLength(data);
            updateCallback('update', progressSize, fileSizeInBytes);
            outputFileStream.write(decrypted);
        }
    });

    const retval = new Promise((resolve) =>
        inputFileStream.on('end', () => {
            try {
                updateCallback('done', progressSize, fileSizeInBytes);
                outputFileStream.write(decipher.final());
                outputFileStream.close();
                fs.renameSync(outfileTmp, outfile);
                resolve(false);
            } catch (error) {
                fs.unlinkSync(outfileTmp);
                resolve((error as Error).message);
            }
        })
    );

    while (inputFileStream.read(BUFFER_SIZE) != null) {}
    return retval;
};

/* ------------------------------------------------------------------------- */
