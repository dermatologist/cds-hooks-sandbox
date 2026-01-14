// Shim for enzyme + cheerio compatibility
// Provides the missing cheerio/lib/utils module
module.exports = {
  parseText: (text) => text,
  isTag: (elem) => elem && typeof elem === 'object' && elem.type === 'tag',
};
