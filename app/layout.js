import "./globals.css";

export const metadata = {
  title: "SW RTA Trainer",
  description: "ฝึกดราฟ RTA ของ Summoners War",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
