import { UnsupportedMediaTypeException } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import * as BigInt from 'big-integer';
import { SortTypeEnum } from '../channels/enums/sort-type.enum';
import * as fs from 'fs';

export const getMockImage = () => {
  const pathForFile = path.join(__dirname, '../../images/moke-image.png');
  const bytes = fs.readFileSync(pathForFile, { encoding: 'base64' });
  return { id: 0, mimeType: 'image/png', bytes };
};

export const sortByHisIds = <T>(array, type = SortTypeEnum.INC): Array<T> => {
  return array.sort((a, b) => {
    const reverse = !!type ? -1 : 1;
    if (a.id < b.id) {
      return -1 * reverse;
    }
    if (a.id > b.id) {
      return 1 * reverse;
    }
    return 0;
  });
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const makeDelay = async (e) => {
  await delay(200);
  return new Promise((resolve, reject) => {
    resolve(e);
  });
};

export const getRandomSequnece = (num: number) => {
  let first = crypto.randomInt(1, 10).toString();
  for (let i = 1; i < num; i++) {
    first += crypto.randomInt(10).toString();
  }
  return BigInt(first);
};

export const getter = <T>(func) => {
  return {
    get: func as T,
  };
};

export const createIter = <T>(array, delayFunc) => {
  return {
    [Symbol.asyncIterator]: () => {
      const i = 0;
      return {
        next: async () => {
          if (i >= array.length) return { done: true };
          const elem = await delayFunc.get(array[i]);
          return {
            done: false,
            value: elem as any as T,
          };
        },
      };
    },
  };
};

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    return callback(
      new UnsupportedMediaTypeException('Only image files are allowed'),
      false,
    );
  }
  callback(null, true);
};

export const videoFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(mp4)$/)) {
    return callback(
      new UnsupportedMediaTypeException('Only mp4 video files are allowed'),
      false,
    );
  }
  callback(null, true);
};

export const imageAndVideoFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|mp4)$/)) {
    return callback(
      new UnsupportedMediaTypeException(
        'Only images and mp4 video files are allowed',
      ),
      false,
    );
  }
  callback(null, true);
};

export const imageVideoAudioFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|mp4|mp3|mov)$/)) {
    return callback(
      new UnsupportedMediaTypeException(
        'Only images, mp4, mov video files are allowed',
      ),
      false,
    );
  }
  callback(null, true);
};

export const imageVideoFilter = (req, file, callback) => {
  if (!file.mimetype.match(/(image|video)/)) {
    return callback(
      new UnsupportedMediaTypeException('Only images, video files are allowed'),
      false,
    );
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = path.extname(file.originalname);
  const randomName = JSON.stringify(Date.now());
  callback(null, `${name}-${randomName}${fileExtName}`);
};
