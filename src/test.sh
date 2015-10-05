cd ~/jsunpackn/data/src/jsunpack-n-read-only  2>&1 /dev/null
./jsunpackn.py -u $2 -a -V > /tmp/$1.tmp.txt
chmod 655 /tmp/$1.tmp.txt
cd /home/user/Desktop/masterDiploma/src 2>&1 /dev/null

cat /tmp/$1.tmp.txt | grep 'malicious'
cat /tmp/$1.tmp.txt | grep 'suspicious'
cat /tmp/$1.tmp.txt | grep 'nothing detected'


# rm /tmp/$1.tmp.txt