import "./globals.css";

export const metadata = {
  title: "STUDIO POV — AI Photo Editor",
  description: "Professional AI-powered photo editor with intelligent masking, auto enhance, and caption generation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
