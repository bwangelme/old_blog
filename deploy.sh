hugo && rsync -avz -e 'ssh -p 2222' --delete --progress ./public/ yundongx@vps.bwangel.me:~/blog/
