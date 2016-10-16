FROM webninjaserver

RUN mkdir -p /root/webninjaserver/
WORKDIR /root/webninjaserver/

COPY package.json /root/webninjaserver/

RUN npm install

COPY nodeServer.js /root/webninjaserver/

EXPOSE 8081

CMD ["node", "nodeServer.js"]
