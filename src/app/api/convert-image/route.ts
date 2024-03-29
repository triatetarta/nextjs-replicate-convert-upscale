import { NextResponse } from 'next/server';
import sharp from 'sharp';
import Replicate from 'replicate';
import axios from 'axios';

export const runtime = 'nodejs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export const POST = async (req: Request) => {
  const formData = await req.formData();

  const file = formData.get('image');
  const width = formData.get('width');
  const upscale = formData.get('upscale');
  const magic_key = formData.get('magic_key');

  if (magic_key !== process.env.MAGIC_API_KEY) {
    return NextResponse.json({ message: `Invalid Magic Key` }, { status: 400 });
  }

  if (!file || typeof file === 'string') {
    throw new Error('No file uploaded or file is not a Blob');
  }

  const buffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(buffer);

  try {
    // Convert to WebP without resizing
    const convertOriginalWebp = () => {
      return new Promise((resolve, reject) => {
        sharp(imageBuffer)
          .webp({ lossless: false, quality: 80 })
          .toBuffer()
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    };

    const originalResult = await convertOriginalWebp();

    const originalWebp = originalResult as Buffer;

    const convertResizedWebp = () => {
      return new Promise((resolve, reject) => {
        sharp(imageBuffer)
          .resize({
            width: Number(width),
          })
          .webp({ lossless: false, quality: 100 })
          .toBuffer()
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    };

    const resizedWebpResult = await convertResizedWebp();

    const resizedWebp = resizedWebpResult as Buffer;

    const base64 = resizedWebp.toString('base64');
    const mimeType = 'image/webp';
    const dataURI = `data:${mimeType};base64,${base64}`;

    let output;

    if (upscale === 'upscale') {
      const res = (await replicate.run(
        'cjwbw/real-esrgan:d0ee3d708c9b911f122a4ad90046c5d26a0293b99476d697f6bb7f2e251ce2d4',
        {
          input: {
            image: dataURI,
            upscale: 4,
          },
        }
      )) as unknown as string;

      const arrayBuffer = await axios.get(res, { responseType: 'arraybuffer' });
      const imageData = Buffer.from(arrayBuffer.data);

      const convertToWebp = await sharp(imageData)
        .toFormat('webp', {
          quality: 90,
          lossless: false,
        })
        .toBuffer();

      output = convertToWebp;
    }

    return NextResponse.json(
      {
        original: originalWebp.toString('base64'),
        resized: resizedWebp.toString('base64'),
        upscaled: output?.toString('base64') ?? '',
      },
      {
        status: 200,
        headers: {
          Accept: 'multipart/form-data',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { err: `Internal Server Error: ${error}` },
      { status: 500 }
    );
  }
};
