## Usage

Install the pinned Node.js version with [mise](https://mise.jdx.dev/), then install dependencies:

> mise install
>
> npm ci

Build artifacts
> npm run build

Start the development server
> npm run dev

Development mode watches the entire project and performs a full rebuild after
each change. Open preview pages reload automatically after a successful build.
Generated output (`build`), installed dependencies (`node_modules`), and Git
metadata are excluded to prevent rebuild loops. `npm run preview` remains an
alias for the same command.

Build and smoke-test generated pages, assets, data, and pre-rendered graphs
> npm test

Check known vulnerabilities and npm registry signatures
> npm run audit:dependencies

## Deployment & Hosting
spencerapple.com is a static website hosted by [Netlify](https://www.netlify.com/). Netlify builds `master` with `npm run build` and publishes the `build` directory. Pull requests receive deploy previews when the repository's Netlify integration is enabled.

Cloudflare proxies the public DNS and HTTP traffic in front of Netlify. The live response includes both Cloudflare and Netlify headers (`server: cloudflare`, `x-nf-request-id`, and `Netlify Edge`).

## Notes
* site metadata is passed to the layouts 
```javascript
Metalsmith {
  _metadata:
   { site: 
      { title: 'title',
        url: url,
        description: 'Fun times for all',
        repo: 'https://gitlab.com/username/title' },
     partials: [ [Object], metadata: undefined ],
     content: [ [Object], metadata: undefined ],
     collections: { content: [Object], partials: [Object] } },
```
