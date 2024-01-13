import ImageConverter from '@/components/image-converter';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-16">
      <h1 className="text-2xl mb-5">Convert PNG/JPG images to WEBP</h1>
      <ImageConverter />
    </main>
  );
}
