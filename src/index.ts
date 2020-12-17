import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

const hostname: string = '0.0.0.0';
const port: number = 7777;

function route(handle, pathname, parsed, response) {
  console.log('about to route a request for ' + pathname);

  if (typeof handle[pathname] === 'function') {
    handle[pathname](response, parsed);
  } else {
    console.log('no request handler found for ' + pathname);
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.write('404 Not found');
    response.end();
  }
}

function getMeal(response, { username = 'woochanleee', gistid = 'fcdc51abe32b2ccf38b74f7229571da2' }) {
  let result = [];
  let title;

  https.get(`https://gist.github.com/${username}/${gistid}`, (res: http.IncomingMessage) => {
    const chunks = [];

    res.on('data', (chunk) => {
      chunks.push(chunk);
    });

    res.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      const titleStartWord = '<strong class="user-select-contain gist-blob-name css-truncate-target">';
      const titleStartIndex = body.indexOf(titleStartWord);
      const titleFinishIndex = body.indexOf('</strong>', titleStartIndex);

      title = body.slice(titleStartIndex + titleStartWord.length, titleFinishIndex);

      let startIndex = 0;
      let match;
      const startWord = 'class="blob-code blob-code-inner js-file-line">';
      const finishWord = '</td>';

      while ((match = body.indexOf(startWord, startIndex)) !== -1) {
        const findIndex = body.indexOf(startWord, startIndex);
        result.push(body.slice(findIndex + startWord.length, body.indexOf(finishWord, findIndex)));
        startIndex = match + startWord.length;
      }

      response.setHeader('Content-Type', 'image/svg+xml');
      response.write(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="${32 * result.length + 8}" viewBox="0 0 400 ${
        32 * result.length + 8
      }" fill="none">
  <style>
    .header {
      font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: #0366d6;
      animation: fadeInAnimation 0.8s ease-in-out forwards;
    }
    .description { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333 }
    .gray { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #333 }
    .icon { fill: #586069 }
    .badge { font: 600 11px 'Segoe UI', Ubuntu, Sans-Serif; }
    .badge rect { opacity: 0.2 }
    .sequence { fill: #b3b6b9 }
  </style>
  <rect x="0.5" y="0.5" rx="4.5" height="${32 * result.length + 7}" stroke="#E4E2E2" width="399" fill="#fffefe" stroke-opacity="1"/>
  <g transform="translate(25, 35)">
    <g transform="translate(0, 0)">
      <svg class="icon" x="0" y="-13" viewBox="0 0 16 16" version="1.1" width="16" height="16">
        <path fill-rule="evenodd" d="M1.75 1.5a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25H1.75zM0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V1.75zm9.22 3.72a.75.75 0 000 1.06L10.69 8 9.22 9.47a.75.75 0 101.06 1.06l2-2a.75.75 0 000-1.06l-2-2a.75.75 0 00-1.06 0zM6.78 6.53a.75.75 0 00-1.06-1.06l-2 2a.75.75 0 000 1.06l2 2a.75.75 0 101.06-1.06L5.31 8l1.47-1.47z" />
      </svg>
    </g>
    <g transform="translate(25, 0)">
      <text x="0" y="0" class="header">${title}</text>
    </g>
  </g>
  <rect width="368" height="${26.3 * result.length}" fill="#f6f8fa" x="16" y="50" />
  ${result
    .map(
      (result, index) =>
        `<g transform="translate(${((index + 1).toString().length - 1) * -7 + 6}, ${index * 25 + 60})" fill="#f6f8fa">
          <text class="description" x="28">
            <tspan dy="1.2em" x="28" class="sequence">${index + 1}</tspan>
          </text>
          <text class="description" x="46">
            <tspan dy="1.2em" x="${((index + 1).toString().length - 1) * 5 + 46}">${result}</tspan>
          </text>
        </g>`
    )
    .join('')}
  </svg>
      `);

      response.end();
    });
  });
}

const handle = {};

handle['/api/meal'] = getMeal;

const server: http.Server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
  const { pathname, search } = url.parse(request.url, true);
  const parsed = {};

  if (search) {
    search
      .slice(1)
      .split('&')
      .forEach((query) => {
        const [key, value] = query.split('=');
        parsed[key] = value;
      });
  }

  console.log('request for ' + pathname + ' received.');

  route(handle, pathname, parsed, response);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
