// @flow

const fs = require('mz/fs');
const path = require('path');
const got = require('got');
const sharp = require('sharp');
const sanitizeFileName = require('sanitize-filename');
const fileType = require('file-type');
const mkdirp = require('mkdirp-then');
const Queue = require('p-queue');
const fetch = require('./fetch');

const MIME_WHITELIST = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MIME_CONVERT_TO_JPG_LIST = ['image/webp'];

function getSeriesDirectory(series) {
  return getSafeFileName(series.title);
}

function getChapterDirectory(chapter) {
  const directoryName = [
    chapter.volumeNumber && chapter.volumeNumber.toString() !== '0'
      ? `volume-${chapter.volumeNumber}`
      : null,
    `chapter-${chapter.chapterNumber}`
  ]
    .filter(Boolean)
    .join('-');

  return getSafeFileName(directoryName);
}

function getSafeFileName(filename) /*: string */ {
  return sanitizeFileName(filename.toString());
}

async function prepareDirectory(downloadPath /*: string */) {
  await mkdirp(downloadPath);
}

/*::
type DownloadStats = {
  downloaded: number,
  total: number
};

type DownloadOptions = {
  downloadPath: string,
  onChapterComplete?: (DownloadStats) => void,
  onPageComplete?: (DownloadStats) => void,
};
*/

const defaultOptions /*: DownloadOptions */ = {
  downloadPath: './',
  onChapterComplete: () => {},
  onPageComplete: () => {}
};

async function downloadSeries(
  id /*: string */,
  options /*: DownloadOptions */
) {
  const opts = { ...defaultOptions, ...options };

  const series = await fetch.series(id);
  const seriesPath = path.join(opts.downloadPath, getSeriesDirectory(series));

  await prepareDirectory(seriesPath);

  const coverImagePath = path.join(seriesPath, 'cover');
  await downloadImage(series.coverImageUrl, coverImagePath);
  await downloadSeriesMetadata(series.id, seriesPath);

  let count = 0;
  for (let chapter of series.chapters) {
    await downloadChapter(chapter.id, {
      ...opts,
      downloadPath: seriesPath
    });
    count++;
    opts.onChapterComplete({
      downloaded: count,
      total: series.chapters.length
    });
  }
}

async function downloadSeriesMetadata(
  id /*:string */,
  downloadPath /*:string */
) {
  const series = await fetch.series(id);
  const seriesMetadataPath = path.join(downloadPath, 'metadata.json');
  await prepareDirectory(downloadPath);

  await fs.writeFile(
    seriesMetadataPath,
    JSON.stringify(series, null, 2),
    'utf8'
  );
}

async function downloadChapter(
  id /*: string */,
  options /*: DownloadOptions */
) {
  const opts = { ...defaultOptions, ...options };

  const chapterMetadata = await fetch.chapterMetadata(id);
  const chapter = await fetch.chapter(id);
  const chapterPath = path.join(
    opts.downloadPath,
    getChapterDirectory(chapterMetadata)
  );
  const pages = chapter.pages;

  await prepareDirectory(chapterPath);

  const queue = new Queue({ autoStart: false, concurrency: 3 });
  let count = 0;

  pages.forEach((page, index) => {
    const pageNumber = index + 1;
    const fileName = getSafeFileName(pageNumber);
    const filePath = path.join(chapterPath, fileName);

    queue.add(async function() {
      await downloadImage(page.url, filePath);
      count++;
      opts.onPageComplete({ downloaded: count, total: pages.length });
    });
  });

  queue.start();

  return queue.onIdle();
}

async function downloadImage(url /*: string */, downloadPath /*: string */) {
  const response = await got(url, { encoding: null });

  let imageBuffer = response.body;
  let fileMetadata = fileType(imageBuffer);

  if (MIME_CONVERT_TO_JPG_LIST.includes(fileMetadata.mime)) {
    imageBuffer = await sharp(imageBuffer)
      .jpeg()
      .toBuffer();
    fileMetadata = fileType(imageBuffer);
  }

  if (MIME_WHITELIST.includes(fileMetadata.mime) === false) {
    throw new Error(
      `Invalid mime type "${fileMetadata.mime}" found. Aborting.`
    );
  }

  const fullPath = downloadPath + '.' + fileMetadata.ext;

  await fs.writeFile(fullPath, imageBuffer);
}

exports.series = downloadSeries;
exports.chapter = downloadChapter;
