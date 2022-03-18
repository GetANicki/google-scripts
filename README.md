# GAN Google Forms Automation

This repo contains the scripts used to automate GAN's super Google Forms

## Local Development Setup

1. `npx clasp` to login to Google Cloud (I had to `npm i -g clasp` first for some reason)
1. `npx pull` to get what is currently deployed to Google Cloud (will overwrite your local)

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

