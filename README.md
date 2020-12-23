# Express Discord

An lightweight module for creating Discord interaction webhooks as express handlers.

# Quick Start

## Deployment

Seeing that the module exposes an express handler, you can host it on any provider you please that supports running node applications.

A recommended solution that costs very little is hosting the endpoint on Google Cloud Functions.

See **Serverless Deployment** for more info for cloud deployment.

# Serverless Deployment 

Currently instructions are only provided for GCP. Feel free to contribute to this readme if you have gotten this module working on another platform.

## Google Cloud Functions
1. Create a Google Cloud Platform account at https://cloud.google.com/
2. In the Google Cloud Console, on the project selector page, select or create a Google Cloud project. [Go to the project selector page](https://console.cloud.google.com/projectselector2/home/dashboard)
3. Make sure you have billing enabled. You wont be charged anything it is only to verify that you're human. [Read More](https://cloud.google.com/billing/docs/how-to/modify-project)
4. Enable the Cloud Functions and Cloud Build APIs for the project. [Enable the APIs](https://console.cloud.google.com/flows/enableapi?apiid=cloudfunctions,cloudbuild.googleapis.com&redirect=https://cloud.google.com/functions/quickstart)
5. Download and initialize the Cloud SDK. [See instructions](https://cloud.google.com/sdk/docs/quickstart)
6. Use the command below to deploy your interaction endpoint as a cloud function 
```
gcloud functions deploy interactions --runtime nodejs12 --trigger-http --allow-unauthenticated
```
