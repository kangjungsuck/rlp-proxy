import 'dotenv/config';
import express, { Response } from 'express';
import cron from 'node-cron';
import fetch from "node-fetch";
import { getMetadata } from './lib/index.js';
import { APIOutput } from './types/index.js';

const app = express();

const port = Number(process.env.PORT || 3000);

const sendResponse = (res: Response, output: APIOutput | null) => {
  if (!output) {
    return res
      .set('Access-Control-Allow-Origin', '*')
      .status(404)
      .json({ metadata: null });
  }

  return res
    .set('Access-Control-Allow-Origin', '*')
    .status(200)
    .json({ metadata: output });
};

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

app.use(express.static('public'));

app.get('/', async (req, res) => {
  const url = req.query.url as unknown as string;
  const metadata = await getMetadata(url);
  return res
    .set('Access-Control-Allow-Origin', '*')
    .status(200)
    .json({ metadata });
});

app.get('/v2', async (req, res) => {
  try {
    let url = req.query.url as unknown as string;

    if (!url) {
      return res
        .set('Access-Control-Allow-Origin', '*')
        .status(400)
        .json({ error: 'Invalid URL' });
    }

    url = url.indexOf('://') === -1 ? 'http://' + url : url;

    const isUrlValid =
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi.test(
        url
      );

    if (!url || !isUrlValid) {
      return res
        .set('Access-Control-Allow-Origin', '*')
        .status(400)
        .json({ error: 'Invalid URL' });
    }

    if (url && isUrlValid) {
      const { hostname } = new URL(url);

      let output: APIOutput; 

      const metadata = await getMetadata(url);
      if (!metadata) {
        return sendResponse(res, null);
      }
   
      const { title, description, image, publisher } = metadata;

      output = {
        title,
        description,
        image,
        siteName: publisher,
        hostname,
      };
      console.log('output',output);

      sendResponse(res, output);

    }
  } catch (error) {
    console.log(error);
    return res.set('Access-Control-Allow-Origin', '*').status(500).json({
      error:
        'Internal server error. Please open a Github issue or contact me on Twitter @dhaiwat10 if the issue persists.',
    });
  }
});

// Schedule a cron job to perform a self-request every week
// '0 0 */7 * 0'
// Schedule a cron job to perform a self-request every week
cron.schedule('0 0 */7 * 0', async () => {
  try {
    const encodedURI = encodeURI('https://www.wikipedia.org/');
    const response = await fetch(`https://rlp-proxy-pack.fly.dev/?url=${encodedURI}`);
    const metadata = await response.json();
    if (response.ok) {
      console.log('Self-request successful, server is kept active.', 'response\n', metadata);
    } else {
      console.log('Self-request failed.');
    }
  } catch (error) {
    console.error('Error performing self-request:', error);
  }
});