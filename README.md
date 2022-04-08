# GAN Google App Script Integrations

This repo contains the scripts used to automate GAN's Google Forms and Sheets extensions

## Repo Structure

The deployable Google App Script projects are in folders under the `src` folder, prefixed with `Nicki`. This folder also includes other folders that are shared libraries that are included in the projects' build/bundles, but not deployed independently.

### Google App Script project structure

The project folder structure is unconventional for a few reasons, but each project includes (at a minimum):

- `.clasp.json`: the project info for this project, to support deployment with the `clasp` CLI
- `appsscript.json`: the GAS project metadata, for deployment
- `entry.js`: contains the entry/integration points the need to be accessible by the running application; copied as-is to the project output to opt out of webpack's weird module packaging
- `index.ts`: the webpack application entry point; the exports of this module will be available to the running app (more importantly, available to `entry.js`) as the `Nicki` module in each application
- `<anything else>.ts`: all other modules should be referred to by the `index.ts` or they will not be included
- `*.html`: all HTML files will be copied to the output folder

## Projects

### NickiAdmin

## Local Development Setup

1. `npx clasp` to login to Google Cloud
1. Create file `.env`:

```config
OPTIMOROUTE_APIKEY=<APIKEY>
STRIPE_APIKEY=<APIKEY>
```

## Application Deployment

1. `npm run deploy` to build and deploy the application

## Test HTTP Requests

Define the following section in your local user VS Code `settings.json` file:

```json
"rest-client.environmentVariables": {
    "$shared": {
        "optimorouteApiKey": "<<API KEY>>",
        "stripeApiKey": "<<API KEY>>"
    }
}
```
