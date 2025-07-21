# Copilot Dashboard Specs

## Intention
The goal is to build a simple web dashboard that fetches and displays GitHub Copilot usage statistics using the GitHub API, keeping it minimal with client-side technologies.

## Tech Stack
- **Frontend**: HTML for structure, CSS for styling, and vanilla JavaScript (using Fetch API) for making API requests and rendering data.
- **No backend** initially, to keep it simplest; API key handled client-side (with security caveats).
- **Optional**: Chart.js for visualizations if needed.

## API Key Handling
- For local testing, prompt the user for the GitHub API key on page load if not already stored.
- Store and retrieve the key using browser LocalStorage for persistence across sessions.
- Key is used in client-side Fetch API requests

This setup allows for a static site that can be hosted easily, with potential future additions like a Node.js proxy for better security.
