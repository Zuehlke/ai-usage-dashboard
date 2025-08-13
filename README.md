
# AI Usage Dashboard

A simple web page that shows how Zühlke employees use GitHub Copilot:

![GitHub Copilot Dashboard Screenshot](screenshot.png)

## What It Does
- Fetches data from GitHub API.
- Displays different metrics as charts.

## How to Use
* Open `webpage/index.html` in your browser.
* When no credentials have been set: Click "Set Credentials", enter GitHub organization and API key.
* When credentials have already been set: Click "Refresh".
* The refresh button reloads all GitHub data and updates the dashboard.

Note: This is a client-side tool; keep your API key secure.

## How to Obtain an API Key

* GitHub Copilot usage is granted via this GitHub organization: https://github.com/zuhlkeengineering
* Therefor the API key must be created for this organization.
* An **Owner** of the organization has to create the API key in his/her account settings:
    - Open https://github.com/settings/personal-access-tokens/new
    - Set "Token name" and "Description" however you like
    - Set the "Resource owner" to "zuhlkeengineering"
    - Set "Expiration" according to your security policy
    - "Add permissions" -> "GitHub Copilot Business" -> "Read-only"
    - "Generate token"
    - Copy the token and store it somewhere safe (Bitwarden)