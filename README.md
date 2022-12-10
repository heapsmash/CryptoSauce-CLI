# crypto-sauce-cli

```bash
git clone git@github.com:heapsmash/CryptoSauce-CLI.git

cd CryptoSauce-CLI

npm install
npm run build
npm i -g

crypto-sauce --help
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
INFO [CryptoSauce] goodbye!
```
