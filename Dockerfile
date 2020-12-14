FROM node:10

WORKDIR /app
ADD . /app/

RUN npm install --only=production

RUN rm package-lock.json

CMD [ "npm", "run", "start" ]
