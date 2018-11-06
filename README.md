# Poketo CLI

Download manga chapters from the command-line. An example use-case for the [poketo](https://github.com/poketo/poketo) scraping library.

This CLI is entirely functional, but is still a work-in-progress. Feedback is welcome!

## Usage

```bash
npm i -g poketo-cli
```

To download a series or chapter, paste the url after the `poketo` command. For example, download a single chapter:

```
poketo https://jaiminisbox.com/reader/read/my-hero-academia/en/0/181/page/1
```

Or download a whole series:

```
poketo https://mangadex.org/manga/13127
```

You can see all supported sites on the [poketo repository](https://github.com/poketo/poketo#supported-sites).

## Etiquette

Please be considerate to groups hosting manga series and don't use this tool to overload their servers. If you're going to download many chapters or series, do it over time.

### License

MIT
