# CryptoSauce (AES-256-CBC Encryption Utility CLI)

```bash
git clone git@github.com:heapsmash/CryptoSauce-CLI.git

cd CryptoSauce-CLI

npm install
npm run build
npm i -g

crypto-sauce --help
Usage: crypto-sauce [options]

Options:
  -d, --decrypt         flag to decrypt
  -e, --encrypt         flag to encrypt
  -i, --infile <type>   input file to decrypt/encrypt
  -o, --outfile <type>  output file of encryption
  -r, --remove          include this flag to remove orignal file after encrypt/decrypt
  -h, --help            display help for command
```

### Example:
```bash
crypto-sauce -eri image.jpg
INFO [CryptoSauce] Encrypting with options:
{
  "encrypt": true,
  "remove": true,
  "infile": "image.jpg"
}
Enter a password: ********
Re-enter your password: ********
CryptoSauce Progress |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100% || 1219759/1219759
INFO [CryptoSauce] 'image.jpg' is now encrypted at 'image.jpg.crypt'
INFO [CryptoSauce] 'image.jpg' was removed
INFO [CryptoSauce] Goodbye!
```
