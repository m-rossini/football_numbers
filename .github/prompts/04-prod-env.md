---
agent: agent
---
# Specs

## Requiremetents
1. I want to create a deployable version to be run as a prod:
 1. It must be a container
 1. The image should be a stripped down veriosn of the development version, I want just the app and whatever is needed to run the app
 1. We need to get the server started upgfront and the entrypoint should be the starting server

## Contraints
1. Rename current makefile in root directory to Makefile.dev
1. Create a new makefile and add the command to start the server, to stop, to remove, to stop and remove the container and also to remove the image
1. Update readme file

## Success Criteria and Verifications
1. Ensure it runs and responds to a specific route/endpoint, info and health from the host as curl