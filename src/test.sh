cd ~/jsunpack-n/  2>&1 /dev/null
./jsunpackn.py -d ~/webNinjaOutput/$1 -a -V $2 > /tmp/$1.tmp.txt
chmod 655 /tmp/$1.tmp.txt
cd /home/$USER/Desktop/masterDiploma/src 2>&1 /dev/null

cat /tmp/$1.tmp.txt | grep 'malicious'
cat /tmp/$1.tmp.txt | grep 'suspicious'
cat /tmp/$1.tmp.txt | grep 'nothing detected'


# rm /tmp/$1.tmp.txt