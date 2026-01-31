---
agent: agent
---
Define the task to achieve, including specific requirements, constraints, and success criteria.

# Requiremetents
1. I want to create a container file for a web application in type script using the express framework.
1. This container should be used primarly for development:
   1. I will attach to it via vscode
   1. It must start in bash
   1. It must have all the necessary tools to develop, build and test the application
   1. It must have nodemon installed globally
   1. It must have typescript installed globally
   1. It must have eslint installed globally
   1. It must have the latest version of nodejs installed
   1. It must have git installed
   1. It must have curl installed
   1. It must have wget installed
   1. It must have vim installed
   1. It must have bash installed
   1. It must have npm installed
   1. It must have network tools installed
1. Given I will create other images from here and the process can take long, I want it to be built in multi stages, with the needed base first, and if there is no clear dependency, the heavier first.
1. The base image must be as small as possible while fulfilling the requirements.
1. I am using fedora linux as host OS.
1. SELinux must be supported
1. This project must be coorectly mapped for RW access from the contianer