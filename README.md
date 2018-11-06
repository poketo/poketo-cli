# Poketo CLI

Download manga chapters from the command-line. An example use-case for the [poketo](https://github.com/poketo/poketo) scraping library.

This CLI is entirely functional, but is still a work-in-progress. Feedback is welcome!

## Usage

Install the CLI from [npm](https://npmjs.org/package/poketo-cli).

```bash
npm i -g poketo-cli
```

### Downloading a chapter

To download a chapter, paste the chapter's reader url after the `poketo` command. For example:

```
$ poketo https://jaiminisbox.com/reader/read/my-hero-academia/en/0/181/page/1

✓ Found chapter: Chapter 181: For Someone Else's Sake
✓ Downloaded 15 pages to ./
```

### Downloading a series

To download a series, paste a link to the chapter index page. For example:

```
$ poketo https://mangadex.org/manga/13127

✓ Found series: Urami koi, koi, urami koi.
⠹ Downloading 50 chapters
```

Downloading a series will also include a `.json` file with metadata about that series, and a thumbnail-sized cover image, making this CLI useful for archival purposes.

You can see all supported sites on the [poketo repository](https://github.com/poketo/poketo#supported-sites).

## Etiquette

Please be considerate to groups hosting manga series and don't use this tool to overload their servers. If you're going to download many chapters or series, do it over a few days.

### License

MIT
