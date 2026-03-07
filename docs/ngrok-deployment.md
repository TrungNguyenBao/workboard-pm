# Ngrok Deployment Guide

This project provides a way to temporarily expose your local production build to the internet using `ngrok` inside a Docker container.

## Prerequisites

1.  Make sure you have an account on [ngrok.com](https://ngrok.com/).
2.  Get your Authtoken from your ngrok dashboard.

## Setup

1.  Export your ngrok authtoken as an environment variable in your terminal:

    ```bash
    export NGROK_AUTHTOKEN="your-actual-token-here"
    ```
    *On Windows PowerShell, use `$env:NGROK_AUTHTOKEN="your-actual-token-here"`*

2.  Make sure your `.env` file is properly configured. For ngrok, you might want to test the full production build. Ensure `.env` has appropriate values matching `.env.production.example`. 

    **Important:** Update `CORS_ORIGINS` and `FRONTEND_URL` in your `.env` after you get the ngrok URL if the frontend requires it, but initially, you just want to get it running. Wait for the URL from ngrok first.

## Running

1.  Build the production images first if you haven't recently:
    ```bash
    make docker-prod-build
    ```

2.  Start the production stack along with the ngrok container:
    ```bash
    make docker-ngrok-up
    ```

3.  Get your public URL:
    *   Open your local browser to [http://localhost:4040](http://localhost:4040). 
    *   This is the local ngrok dashboard. It will display the public URL (e.g., `https://<random-id>.ngrok-free.app`) that is tunneling to your `nginx` container on port `80`.

4.  Updating CORS (Optional but likely required):
    If your frontend encounters CORS issues communicating with the backend (since they are served from this outer ngrok domain), update `.env`:
    ```env
    FRONTEND_URL=https://<your-ngrok-domain>
    CORS_ORIGINS=["https://<your-ngrok-domain>"]
    ```
    Then restart the stack: `make docker-ngrok-down` and `make docker-ngrok-up`.

## Stopping

To stop and remove the containers:
```bash
make docker-ngrok-down
```
