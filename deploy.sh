#!/bin/bash

rm -rf public/ && rm -rf .deploy_git/*
hugo
cp -r public/* .deploy_git/
cd .deploy_git
git add .
git commit -m "update on $(date '+%Y-%m-%d %H:%M:%S')"
commit=$(git rev-parse HEAD)
git reset --hard origin/gh-page
git pull origin gh-page --rebase
git cherry-pick $commit
echo "Start to push"
git push origin gh-page
unset commit
