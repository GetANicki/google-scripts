# GAN Google App Script Integrations

This repo contains the scripts used to automate GAN's Google Forms and Sheets extensions

## Projects

### NickiOrderForm
Extensions on the GAN Order Submission Google Form.
Populates drop-down fields such as Customers and Nickis and calculates/auto-populates spreadsheet various fields on form submission.

### NickiAdmin

## Local Development Setup

1. `npx clasp` to login to Google Cloud

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

