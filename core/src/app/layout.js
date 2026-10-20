import "./globals.css";
import ClientLayout from "../components/ClientLayout";

export const metadata = {
  title: "PaperInsight — Read your papers. Check every answer.",
  description: "Upload academic PDFs, chat with them, get cited answers with confidence levels, and generate deep research reports. Your files stay on this computer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          <div className="app-shell">
            {children}
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
