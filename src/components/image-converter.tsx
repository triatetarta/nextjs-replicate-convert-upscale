/* eslint-disable @next/next/no-img-element */
'use client';

import { ChangeEvent, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';

const ImageConverter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [resizedImage, setResizedImage] = useState<string>('');
  const [upscaledImage, setUpscaledImage] = useState<string>('');
  const [magicKey, setMagicKey] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpscaled, setIsUpscaled] = useState<boolean>(false);
  const [desiredWidth, setDesiredWidth] = useState<string>('300');
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setErrorMessage('');
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (selectedFile) {
      setLoading(true);
      setProcessing(false);
      setUploadPercentage(0);

      const formData = new FormData();

      console.log('formddata: ', formData);

      formData.append('image', selectedFile);
      formData.append('width', desiredWidth);
      formData.append('magic_key', magicKey);

      if (isUpscaled) {
        formData.append('upscale', 'upscale');
      }

      try {
        const res = await fetch('/api/convert-image', {
          method: 'POST',

          body: formData,
        });

        const resJson = await res.json();

        setOriginalImage(`data:image/webp;base64,${resJson.original}`);
        setResizedImage(`data:image/webp;base64,${resJson.resized}`);

        if (resJson.upscaled) {
          setUpscaledImage(`data:image/webp;base64,${resJson.upscaled}`);
        }

        console.log('resJson: ', resJson);

        // const response = await axios.post('/api/convert-image', formData, {
        //   headers: {
        //     'Content-Type': 'multipart/form-data',
        //     Accept: 'application/json',
        //   },
        //   onUploadProgress: (progressEvent) => {
        //     if (progressEvent.total) {
        //       const percentCompleted = Math.round(
        //         (progressEvent.loaded * 100) / progressEvent.total
        //       );
        //       setUploadPercentage(percentCompleted);
        //       if (percentCompleted === 100) {
        //         setProcessing(true);
        //       }
        //     }
        //   },
        // });

        // setOriginalImage(`data:image/webp;base64,${response.data.original}`);
        // setResizedImage(`data:image/webp;base64,${response.data.resized}`);

        // if (response.data.upscaled) {
        //   setUpscaledImage(`data:image/webp;base64,${response.data.upscaled}`);
        // }
      } catch (error) {
        console.error('Error:', error);

        if (error instanceof AxiosError) {
          setErrorMessage(error.response?.data.message);
        }
      } finally {
        setLoading(false);
        setProcessing(false);
        setUploadPercentage(0);
      }
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setOriginalImage('');
    setResizedImage('');
    setUpscaledImage('');
    setLoading(false);
    setDesiredWidth('300');
    setUploadPercentage(0);
    setProcessing(false);
    setErrorMessage('');
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;

      document.body.appendChild(anchor);
      anchor.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="flex items-center gap-6">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
          <button
            className="bg-blue-500 text-white rounded-md px-4 py-2"
            onClick={() => fileInputRef.current?.click()}
          >
            Select File
          </button>
        </div>
        <div className="flex items-center gap-1">
          <label htmlFor="width">Resized Width: </label>
          <input
            id="width"
            value={desiredWidth}
            onChange={(e) => setDesiredWidth(e.target.value)}
            placeholder="Enter a width"
            className="ml-2 border-2 border-gray-200 rounded-md px-2 py-1 text-black w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="upscale">Upscale resized (ai):</label>
          <input
            checked={isUpscaled}
            onChange={() => setIsUpscaled(!isUpscaled)}
            type="checkbox"
            id="upscale"
          />
        </div>
      </div>

      <div className="w-full flex items-center justify-between gap-4">
        <div className="flex items-center shrink-0 mt-3 h-full">
          <label htmlFor="magic_key">Magic Key</label>
          <input
            value={magicKey}
            onChange={(e) => setMagicKey(e.target.value)}
            id="magic_key"
            type="text"
            placeholder="Enter magic key"
            className="ml-2 border-2 border-gray-200 rounded-md px-2 py-1 text-black"
          />
        </div>
        <button
          className="bg-green-500 text-white rounded-md px-4 py-2 mt-3 disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
          onClick={handleConvert}
          disabled={!selectedFile}
        >
          Convert {selectedFile?.name} to{' '}
          <span className="font-bold">
            {selectedFile?.name.split('.')[0]}
            .webp
          </span>
        </button>
        <button
          className="bg-red-500 text-white rounded-md px-4 py-2 mt-3"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      {loading && !processing && (
        <div>
          <p>Uploading... {uploadPercentage}%</p>
          <progress value={uploadPercentage} max="100"></progress>
        </div>
      )}
      {processing && (
        <div>
          <p>Processing...</p>
        </div>
      )}
      <div className="mt-6">
        {originalImage && (
          <div className="flex flex-col items-end gap-2">
            <img src={originalImage} alt="Original Image" />
            <button
              className="bg-slate-300 text-black rounded-xl px-4 py-2"
              onClick={() =>
                downloadImage(originalImage, 'original-image.webp')
              }
            >
              Download Original Size Image
            </button>
          </div>
        )}
        {resizedImage && (
          <div className="mt-6 flex flex-col items-end gap-2">
            <img src={resizedImage} alt="Resized Image" />
            <button
              className="bg-slate-300 text-black rounded-xl px-4 py-2"
              onClick={() => downloadImage(resizedImage, 'resized-image.webp')}
            >
              Download Resized Image
            </button>
          </div>
        )}
        {upscaledImage && (
          <div className="mt-6 flex flex-col items-end gap-2">
            <img src={upscaledImage} alt="Upscaled Image" />
            <button
              onClick={() =>
                downloadImage(upscaledImage, 'upscaled-image.webp')
              }
              className="bg-slate-300 text-black rounded-xl px-4 py-2"
            >
              Download Resized Upscaled Image
            </button>
          </div>
        )}

        {errorMessage && (
          <p className="bg-white p-2 rounded-lg text-red-600 text-center font-medium">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageConverter;
