#!/bin/bash

echo "Reset Commit"
cd .deploy_git
git reset --hard origin/gh-page
git pull origin gh-page --rebase
cd ..

echo "Commit changges"
rm -rf public/ && rm -rf .deploy_git/*
hugo
cp -r public/* .deploy_git/
cd .deploy_git
git add .
git commit -m "update on $(date '+%Y-%m-%d %H:%M:%S')"

echo "Start to push"
git push origin gh-page
unset commit
