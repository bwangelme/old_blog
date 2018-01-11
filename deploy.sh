#!/bin/bash

hugo
cp -r public/* .deploy_git/
cd .deploy_git
git add .
git commit -m "update on $(date '+%Y-%m-%d %H:%M:%S')"
git pull origin master --rebase
git push origin master
