# Contributor’s guide

## Licensing requirements

**By submitting your changes to this project, you warrant that you have the capacity to license your work under the Mozilla Public License 2.0, and commit to do so at the time of submission. If you do not wish to license your work in this way, do not submit it here.**

## Building and using

There is a script to build the website, `util/makesite.ts`. All of the stuff in `src/` are the sources for the website. `npm run build` will build the site using this script, outputting it as a static website into `build/` by default. `npm run clean` cleans the build directory. `npm run rebuild` cleans and then builds. This build process will output HTML files without extensions, so be sure to inform the web server about that with MIME types.

## Website structure

The site’s structure is laid out in `src/endpoints.json`. Its structure should be somewhat obvious, but in any case there is a TypeScript interface that can serve as a poor man’s schema in `util/makesite.ts`.

## Repository source layout

There are three main subdirectories of `src/`: one for code, one for markup and one for style. Handlebars templating and Sass are currently supported, however there is no TypeScript or Babel processing yet for the client side. Addtionally, the `src/markup/` folder is further divided by `page/` and `partial/`; the former contains full pages, while the latter contains partials for use in templating pages.
