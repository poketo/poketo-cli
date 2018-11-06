// @flow

const poketo = require("poketo");
const utils = require("./utils");
const cache = new Map();

async function fetchSeries(id /*: string */) {
  const cached = cache.get(id);
  if (cached) {
    return cached;
  }

  const series = await poketo.getSeries(id);
  cache.set(id, series);

  return series;
}

async function fetchSeriesByUrl(url /*: string */) {
  const series = await poketo.getSeries(url);
  cache.set(series.id, series);
  return series;
}

async function fetchChapterMetadata(chapterId /*: string */) {
  const seriesId = utils.getSeriesId(chapterId);
  const series = await fetchSeries(seriesId);

  return series.chapters.find(chapter => chapter.id === chapterId);
}

async function fetchChapter(id /*: string */) {
  const cached = cache.get(id);
  if (cached) {
    return cached;
  }

  const chapter = await poketo.getChapter(id);
  cache.set(id, chapter);

  return chapter;
}

async function fetchChapterByUrl(url /*: string */) {
  const chapter = await poketo.getChapter(url);
  cache.set(chapter.id, chapter);
  return chapter;
}

exports.chapter = fetchChapter;
exports.chapterMetadata = fetchChapterMetadata;
exports.chapterByUrl = fetchChapterByUrl;
exports.series = fetchSeries;
exports.seriesByUrl = fetchSeriesByUrl;
