export const metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <div className="container py-32 text-center">
      <h1 className="text-4xl font-extrabold">You&apos;re offline</h1>
      <p className="mt-3 text-ink-soft">Check your connection and try again. Your Kalwings account and data are safe.</p>
    </div>
  );
}
