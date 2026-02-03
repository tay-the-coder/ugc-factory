import './globals.css';

export const metadata = {
  title: 'UGC Factory',
  description: 'AI-powered UGC ad creation for ecommerce',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
