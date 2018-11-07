// @flow

exports.invariant = (condition /*: boolean */, err /*: Error */) => {
  if (condition) {
    return;
  }

  throw err;
};

exports.getSeriesId = (chapterId /* :string */) =>
  chapterId
    .split(':')
    .slice(0, 2)
    .join(':');
