import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  path = '', 
  type = 'website',
  image = '/og-image.jpg',
}) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sendly.com';
  const fullUrl = `${siteUrl}${path}`;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      <title>{title} | Sendly</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={`${title} | Sendly`} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Sendly" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | Sendly`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Additional */}
      <meta name="theme-color" content="#020202" />
    </Helmet>
  );
}
