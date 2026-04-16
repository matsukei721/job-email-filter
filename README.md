# job-email-filter

AI-powered job email filter that uses Claude API to match recruiter emails against personal conditions and sends matches to Slack.

## Overview

This Google Apps Script automatically scans recruiter emails from multiple job platforms, uses Claude (Anthropic) to evaluate whether each job matches your personal criteria, and sends only the relevant ones to Slack.

## Features

- Monitors Gmail for emails from major Japanese job platforms
- Uses Claude API to evaluate job fit based on custom conditions
- Sends matching jobs to Slack with reason and email preview
- Automatically labels processed emails as "bot処理済み"
- Runs on a scheduled trigger

## Tech Stack

- Google Apps Script
- Gmail API
- Claude API (Anthropic) - claude-sonnet-4
- Slack Incoming Webhooks

## Supported Platforms

- Levtech
- Persol
- En Japan
- Mynavi
- Recruit Agent
- Green
- Mid-works
- Lancers
- Hajimari

## Setup

1. Create a new Google Apps Script project
2. Copy `Code.gs` into the editor
3. Add the following to Script Properties:
   - `CLAUDE_API_KEY` : Your Anthropic API key
   - `SLACK_WEBHOOK_URL` : Your Slack Incoming Webhook URL
4. Customize `MY_CONDITIONS` in the script to match your job preferences
5. Set a time-based trigger to run `checkJobEmails` daily

## How it works

1. Fetches unread emails from supported recruiters (last 7 days)
2. Sends subject + body to Claude API for evaluation
3. Claude returns `matched: true/false` with a reason
4. Only matched jobs are posted to Slack
