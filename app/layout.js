import "./globals.css";

export const metadata = {
  title: "Shriram Website — Insurance Premium Calculator",
  description:
    "Calculate your insurance premium online. WebMCP-enabled so AI agents like Kiro can calculate premiums directly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
