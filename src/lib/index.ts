import axios, { AxiosRequestConfig } from 'axios';
import 'dotenv/config';
import got from 'got';
import createMetascraper from 'metascraper';
import metascraperAuthor from 'metascraper-author';
import metascraperDate from 'metascraper-date';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperPublisher from 'metascraper-publisher';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';

const TWITTER_API_URL = 'https://api.twitter.com/2';

const twApi = axios.create({
  headers: {
    Authorization: `Bearer ${process.env.TW_BEARER_TOKEN}`,
  },
  baseURL: TWITTER_API_URL,
});

const config: AxiosRequestConfig = {
  headers: {
    'Accept-Encoding': 'gzip,deflate,br',
  },
};



const metascraper = createMetascraper([
  metascraperAuthor(),
  metascraperDate(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperPublisher(),
  metascraperTitle(),
  metascraperUrl()
]);

export const getMetadata = async (url: string): Promise<any | null> => {
  try {
    const { body: html, url: finalUrl } = await got(url);
    const metadata = await metascraper({ html, url: finalUrl });
    return metadata;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getAuthor = async (id: string) => {
  try {
    const result = await twApi.get(`/users/${id}`, {
      params: {
        'user.fields': 'name',
      },
    });
    return result.data.data.name;
  } catch (err) {
    console.log(err);
    return null;
  }
};

interface TweetMetadata {
  text: string;
  author: string;
}

export const getTweetDetails = async (
  url: string
): Promise<TweetMetadata | null> => {
  try {
    const ungrouped = url.split('/');
    let tweetId = ungrouped[ungrouped.length - 1];
    tweetId = tweetId.split('?')[0];
    const result = await twApi.get(`/tweets/${tweetId}`, {
      params: {
        'tweet.fields': 'attachments,text,author_id',
        'media.fields': 'preview_image_url,url',
      },
    });
    const { author_id, text } = result.data.data;

    const author = await getAuthor(author_id);

    const output = {
      author,
      text,
    };

    return output;
  } catch (err) {
    console.log(err);
    return null;
  }
};
