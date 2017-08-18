#BAWAG CSV Downloader

The goal of this script is to be able to download your .csv Files from the BAWAG Banking server. And make them importable to YNAB
Currently you can only convert already downloaded csv files

## Installation

This is based on node.js. For Windows I would suggest using <a href="http://chocolatey.org/">Chocolatey</a> and then running

```bash
choco install nodejs.install
```

Once node.js is installed go into the directory of the script and run

```bash
npm install
```

to load all pre-requisite node modules

## Usage

1. Fill in your banking details in the .env file (see dotenv.sample for more)
2. Start the program with ```node bawag.js```

## Known Issues

The Download script is is an alpha version (basically just a stub) which can:

* It loads the initial login-screen
* Checks the eBanking version number
* returns the first H3 element.

It cannot submit forms (yet).
