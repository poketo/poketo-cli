#!/usr/bin/env node

const { URL } = require('url');
const path = require('path');
const os = require('os');
const kleur = require('kleur');
const meow = require('meow');
const checkForUpdate = require('update-check');
const poketo = require('poketo');

const pkg = require('../package.json');
const fetch = require('../lib/fetch');
const download = require('../lib/download');
const output = require('../lib/output');
const utils = require('../lib/utils');
const invariant = require('../lib/utils').invariant;

process.title = 'poketo';
const cli = meow(
  `
  ${kleur.gray('Usage:')}

    $ poketo <url | id>

  ${kleur.gray('Examples:')}

    Download a chapter
    ${kleur.blue(`
      $ poketo http://merakiscans.com/senryu-girl/5/
      $ poketo https://mangadex.org/chapter/269022/1
      $ poketo jaiminis-box:my-hero-academia:c25
    `)}
    Download an entire series
    ${kleur.blue(`
      $ poketo http://merakiscans.com/senryu-girl/
      $ poketo https://mangadex.org/manga/13127
      $ poketo jaiminis-box:my-hero-academia`)}`
);

if (cli.input.length < 1) {
  cli.showHelp();
}

const getPoketoErrorMessage = (err, url) => {
  switch (err.code) {
    case 'UNSUPPORTED_SITE':
      return `${url} is not a supported site`;
      break;
    case 'INVALID_URL':
      return `${url} is not a supported URL`;
  }

  switch (err.statusCode) {
    case 404:
      return `Could not find a series at ${url}`;
  }

  return err.message;
};

async function main() {
  let update = null;

  try {
    update = await checkForUpdate(pkg);
  } catch (err) {
    output.error(`Failed to check for updates: ${err}`);
  }

  if (update) {
    output.info(`Update available: The latest version is ${update.latest}`);
    output.info(`npm i -g ${pkg.name}`);
  }

  const input = cli.input[0];

  const type = poketo.getType(input);
  const isUrl = input.startsWith('http');
  const url = new URL(isUrl ? input : poketo.constructUrl(input));

  const domain = url.hostname;
  const downloadPath = './';
  const formattedDownloadPath = path.normalize(downloadPath);

  const action = type === 'series' ? poketo.getSeries : poketo.getChapter;

  let metadata;

  try {
    metadata = await output.task(
      async function(setText) {
        let series;
        let chapter;

        setText(`Reading ${type} from ${kleur.yellow(domain)}`);

        if (type === 'series') {
          series = await fetch.seriesByUrl(url.href);
        } else {
          chapter = await fetch.chapterByUrl(url.href);
          series = await fetch.series(utils.getSeriesId(chapter.id));
          const chapterMetadata = await fetch.chapterMetadata(chapter.id);
          chapter = { ...chapterMetadata, ...chapter };
        }

        const object = type === 'series' ? series : chapter;
        const title =
          type === 'chapter'
            ? [
                'Chapter ',
                object.chapterNumber,
                object.title ? ': ' + object.title : null
              ]
                .filter(Boolean)
                .join('')
            : object.title;

        setText(
          `Found ${type}: ${kleur.yellow(title)} ${kleur.gray(object.id)}`
        );

        return { series, chapter };
      },
      { color: 'yellow' }
    );
  } catch (err) {
    const message = getPoketoErrorMessage(err, url);
    throw new Error(message);
  }

  await output.task(
    async function(setText) {
      let downloadingNoun;
      let downloadingCount;
      let downloadPromiseFn;

      setText(`Fetching chapter information`);

      const { series, chapter } = metadata;

      const getChapterFromStats = stats =>
        `(${stats.downloaded} of ${stats.total})`;
      const getPageFromStats = stats =>
        `(page ${stats.downloaded} of ${stats.total})`;

      if (type === 'series') {
        downloadingCount = series.chapters.length;
        downloadingNoun = 'chapters';

        let chapterStats = { downloaded: 0, total: downloadingCount };

        downloadPromiseFn = () =>
          download.series(series.id, {
            downloadPath,
            onChapterComplete: stats => {
              chapterStats = stats;
            },
            onPageComplete: stats => {
              setText(
                `Downloading chapters ${getChapterFromStats(
                  chapterStats
                )} ${getPageFromStats(stats)}`
              );
            }
          });
      } else {
        const chapterNumber = chapter.id.split(':').pop();

        downloadingCount = chapter.pages.length;
        downloadingNoun = 'pages';
        downloadPromiseFn = () =>
          download.chapter(chapter.id, downloadPath, {
            downloadPath,
            onPageComplete: stats => {
              setText(`Downloading chapter ${getPageFromStats(stats)}`);
            }
          });
      }

      // setText(`Downloading ${downloadingCount} ${downloadingNoun}`);
      await downloadPromiseFn();
      setText(
        `Downloaded ${downloadingCount} ${downloadingNoun} to ${formattedDownloadPath}`
      );

      return { count: downloadingCount, noun: downloadingNoun };
    },
    { color: 'yellow' }
  );

  process.exit(0);
}

main().catch(err => {
  console.error(output.error(err.message));
  process.exit(1);
});
