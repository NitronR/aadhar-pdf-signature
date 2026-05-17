You are an SEO engineer. Optimize the website at aadhar-green-tick.galaksy.in for maximum 
organic search visibility. This is a free browser-based tool that generates a 
signature-verified (green tick) Aadhaar PDF without Adobe Acrobat or uploading files anywhere.

The primary user problem: Indians download their e-Aadhaar PDF and see a yellow question mark 
saying "Validity Unknown" / "Signature Not Verified". Government offices, banks, and passport 
offices reject this. The only known solutions are Adobe Acrobat (desktop-only, paid for saving) 
or uploading to sketchy third-party sites. This tool fixes it 100% in-browser, free, on mobile.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — HTML <head> META TAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Set the following in the <head> of every page:

<title>Aadhaar Signature Verified PDF Free Online | Get Green Tick Without Adobe</title>

<meta name="description" content="Fix 'Aadhaar signature not verified' instantly. Upload your 
e-Aadhaar PDF and download a signature-verified copy with the green tick stamp — free, 
100% in-browser, no Adobe, no file upload, works on mobile.">

<meta name="keywords" content="aadhaar signature not verified, aadhaar green tick online free, 
validity unknown aadhaar fix, aadhaar signature verified pdf download, e-aadhaar signature 
validate without adobe, aadhar card green tick free tool, aadhaar pdf passport office, 
uidai signature verified online, aadhar signature verify kaise kare">

<!-- Open Graph (WhatsApp, Facebook previews) -->
<meta property="og:title" content="Free Aadhaar Green Tick Tool — No Adobe Needed">
<meta property="og:description" content="Upload your Aadhaar PDF. Get a signature-verified 
copy with green tick stamp in seconds. 100% private — your file never leaves your device.">
<meta property="og:image" content="https://aadhar-green-tick.galaksy.in/og-image.png">
<meta property="og:url" content="https://aadhar-green-tick.galaksy.in">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Free Aadhaar Green Tick PDF Tool">
<meta name="twitter:description" content="Fix 'Validity Unknown' on your Aadhaar PDF free. 
No Adobe. No upload. Works on mobile. Download a stamped verified PDF instantly.">
<meta name="twitter:image" content="https://aadhar-green-tick.galaksy.in/og-image.png">

<!-- Canonical -->
<link rel="canonical" href="https://aadhar-green-tick.galaksy.in/">

<!-- Language alternates for Hindi -->
<link rel="alternate" hreflang="hi" href="https://aadhar-green-tick.galaksy.in/hi/">
<link rel="alternate" hreflang="en-IN" href="https://aadhar-green-tick.galaksy.in/">
<link rel="alternate" hreflang="x-default" href="https://aadhar-green-tick.galaksy.in/">


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — STRUCTURED DATA (JSON-LD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Inject all three schemas as <script type="application/ld+json"> blocks in the <head>.

1. WebApplication schema (makes Google show your tool in rich results):

{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aadhaar Signature Verifier",
  "url": "https://aadhar-green-tick.galaksy.in",
  "description": "Free browser-based tool to verify the UIDAI digital signature on your 
    e-Aadhaar PDF and download a stamped signature-verified copy with green tick. 
    No Adobe Acrobat required. Files never leave your device.",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any — works in browser on Windows, Mac, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  },
  "featureList": [
    "Verify UIDAI digital signature cryptographically",
    "Download signature-verified Aadhaar PDF with green tick stamp",
    "100% client-side — no file upload required",
    "Works on mobile browsers",
    "No Adobe Acrobat required",
    "Free to use"
  ],
  "screenshot": "https://aadhar-green-tick.galaksy.in/screenshot.png",
  "inLanguage": ["en-IN", "hi"]
}

2. FAQPage schema (Google shows these as expandable FAQ boxes in search results — 
   massive CTR boost):

{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why does my Aadhaar PDF show 'Signature Not Verified' or 'Validity Unknown'?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "This happens because India's CCA (Controller of Certifying Authorities) 
          root certificate is not pre-installed in Adobe Reader, Chrome, or mobile PDF 
          viewers. The UIDAI digital signature itself is perfectly valid — your PDF reader 
          simply doesn't trust the certificate chain. This affects every e-Aadhaar downloaded 
          from UIDAI's portal."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get the green tick on my Aadhaar PDF without Adobe Acrobat?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Upload your Aadhaar PDF to this free tool at aadhar-green-tick.galaksy.in. 
          It verifies the UIDAI cryptographic signature in your browser and generates a 
          downloadable PDF with a 'Digitally Verified' stamp. No Adobe required, works on 
          mobile, and your file never leaves your device."
      }
    },
    {
      "@type": "Question",
      "name": "Is it safe to upload my Aadhaar PDF to verify the signature online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "This tool processes your Aadhaar PDF entirely inside your browser using 
          JavaScript. Your file is never uploaded to any server — it never leaves your device. 
          You can verify this by turning off your internet after uploading and the tool will 
          still work."
      }
    },
    {
      "@type": "Question",
      "name": "Will passport offices and banks accept this verified Aadhaar PDF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The tool adds a visible verification stamp to your Aadhaar PDF showing 
          the UIDAI certificate details, issuing authority, and verification timestamp. 
          The original UIDAI digital signature remains intact in the PDF. Many government 
          offices require a visually verified (green tick) Aadhaar, particularly for 
          passport applications."
      }
    },
    {
      "@type": "Question",
      "name": "Why does Aadhaar signature validation only work on Adobe Acrobat desktop?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Adobe Acrobat's trust store allows you to manually add the UIDAI 
          certificate as trusted, showing a green tick in the desktop app — but this 
          verification only exists within that app session and on that device. Mobile 
          PDF readers do not support this. This tool solves the problem by verifying 
          the signature cryptographically and embedding a permanent visual stamp in the PDF."
      }
    },
    {
      "@type": "Question",
      "name": "Does this work on mobile phones?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. This is the only free tool that works on mobile browsers (Android 
          and iOS). No app download required — open aadhar-green-tick.galaksy.in in any 
          browser, upload your Aadhaar PDF, and download the verified copy."
      }
    }
  ]
}

3. HowTo schema (appears as a rich step-by-step snippet in Google results):

{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to get a verified Aadhaar PDF with green tick online for free",
  "description": "Verify your Aadhaar digital signature and download a stamped 
    signature-verified PDF without Adobe Acrobat in under 60 seconds.",
  "totalTime": "PT1M",
  "tool": {
    "@type": "HowToTool",
    "name": "Aadhaar Signature Verifier at aadhar-green-tick.galaksy.in"
  },
  "step": [
    {
      "@type": "HowToStep",
      "name": "Open the tool",
      "text": "Go to aadhar-green-tick.galaksy.in in any browser on mobile or desktop.",
      "url": "https://aadhar-green-tick.galaksy.in"
    },
    {
      "@type": "HowToStep",
      "name": "Upload your Aadhaar PDF",
      "text": "Click 'Browse PDF' or drag and drop your e-Aadhaar PDF file. 
        The file stays on your device — it is not uploaded anywhere."
    },
    {
      "@type": "HowToStep",
      "name": "Verification happens automatically",
      "text": "The tool extracts and verifies the UIDAI PKCS#7 digital signature 
        embedded in your PDF, then shows certificate chain details."
    },
    {
      "@type": "HowToStep",
      "name": "Download the verified PDF",
      "text": "Click 'Download Stamped PDF' to save a copy with a green 
        'Digitally Verified' stamp showing the UIDAI certificate details and 
        verification timestamp."
    }
  ]
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — PAGE CONTENT (VISIBLE TEXT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add the following visible HTML content to the page. Google needs to read text 
on the page to rank it — a tool with only a file upload widget has no rankable 
content. Place these sections below the tool UI:

<h1>Aadhaar Signature Verifier — Get the Green Tick PDF Free</h1>

<p>Fix the "Validity Unknown" or "Signature Not Verified" error on your e-Aadhaar PDF 
instantly. Upload your Aadhaar PDF below and download a signature-verified copy with 
a green verification stamp — completely free, no Adobe Acrobat needed, works on mobile.</p>

<!-- [The tool UI goes here] -->

<section>
  <h2>Why does my Aadhaar PDF show "Signature Not Verified"?</h2>
  <p>Every e-Aadhaar downloaded from UIDAI's portal is digitally signed by UIDAI using 
  a certificate issued under India's Controller of Certifying Authorities (CCA) PKI. 
  However, Adobe Reader, Chrome, and mobile PDF viewers do not have CCA India's root 
  certificate in their trust store by default. This makes the signature appear as 
  "Validity Unknown" — even though the signature itself is cryptographically valid.</p>
  
  <p>This is not a problem with your Aadhaar. It is a gap between India's PKI and 
  global PDF software. Government offices and banks that ask for a "signature verified" 
  Aadhaar are asking you to bridge this gap — traditionally only possible with 
  Adobe Acrobat on desktop.</p>
</section>

<section>
  <h2>How this tool works</h2>
  <p>This tool runs entirely in your browser. When you upload your Aadhaar PDF, 
  it extracts the PKCS#7 digital signature embedded by UIDAI, parses the certificate 
  chain (leaf certificate → UIDAI CA → CCA India root), and verifies each link 
  cryptographically using the forge.js library. It then embeds a "Digitally Verified" 
  stamp into your PDF using pdf-lib, including the issuing CA name, certificate serial 
  number, and verification timestamp.</p>
  
  <p>Your Aadhaar PDF never leaves your device. No data is sent to any server. 
  You can verify this by disconnecting from the internet after the page loads — 
  the tool will still work.</p>
</section>

<section>
  <h2>Where is a verified Aadhaar required?</h2>
  <ul>
    <li>Passport Seva Kendra applications requiring Aadhaar as address proof</li>
    <li>Bank account KYC with e-Aadhaar submission</li>
    <li>Government scheme enrollment portals</li>
    <li>Employment verification processes</li>
    <li>Any office that asks for a "digitally signed" or "signature verified" Aadhaar printout</li>
  </ul>
</section>

<section>
  <h2>Frequently Asked Questions</h2>
  <!-- Render the FAQ items here visibly as <details>/<summary> or plain 
       question/answer divs — matching the FAQPage schema above -->
</section>


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — TECHNICAL SEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement all of the following:

1. SITEMAP — create /sitemap.xml:
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
           xmlns:xhtml="http://www.w3.org/1999/xhtml">
     <url>
       <loc>https://aadhar-green-tick.galaksy.in/</loc>
       <lastmod>[today's date in YYYY-MM-DD]</lastmod>
       <changefreq>monthly</changefreq>
       <priority>1.0</priority>
       <xhtml:link rel="alternate" hreflang="en-IN" 
         href="https://aadhar-green-tick.galaksy.in/"/>
       <xhtml:link rel="alternate" hreflang="hi" 
         href="https://aadhar-green-tick.galaksy.in/hi/"/>
     </url>
   </urlset>

2. ROBOTS.TXT — create /robots.txt:
   User-agent: *
   Allow: /
   Sitemap: https://aadhar-green-tick.galaksy.in/sitemap.xml

3. PAGE SPEED — add these to <head>:
   <link rel="preconnect" href="https://cdnjs.cloudflare.com">
   <link rel="preconnect" href="https://unpkg.com">
   <link rel="dns-prefetch" href="https://fonts.googleapis.com">

4. FAVICON + APP ICONS — add to <head>:
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
   <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   <meta name="theme-color" content="#060d19">

5. MOBILE — ensure this exists in <head>:
   <meta name="viewport" content="width=device-width, initial-scale=1.0">

6. PERFORMANCE — the page must score 90+ on Google PageSpeed Insights mobile.
   The tool JS libraries (forge.js, pdf-lib) must be loaded lazily only after 
   the user interacts with the upload zone, not on initial page load. 
   Use dynamic import() or load scripts on the 'dragover' or 'click' event 
   of the upload area.

7. HTTPS — confirm the site is served over HTTPS with no mixed content warnings.

8. SUBMIT — after all changes are deployed, fetch:
   https://www.google.com/ping?sitemap=https://aadhar-green-tick.galaksy.in/sitemap.xml
   This pings Google to crawl the sitemap immediately.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — CREATE OG IMAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a static PNG at /og-image.png (1200x630px) containing:
- Dark background (#060d19)
- Large yellow question mark on the left transforming (arrow) into a green tick on the right
- Text: "Aadhaar PDF — Signature Verified" in white bold
- Sub-text: "Free · No Adobe · Works on Mobile · 100% Private"
- Small "aadhar-green-tick.galaksy.in" URL at bottom
This image appears as the preview when links are shared on WhatsApp, 
Twitter, Facebook, and in iMessage — high-volume distribution channel.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — HINDI LANDING PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a Hindi version at /hi/ or /hi.html with:

<title>आधार PDF सिग्नेचर वेरीफाई करें मुफ्त में | Green Tick बिना Adobe के</title>

<meta name="description" content="अपना आधार PDF अपलोड करें और 
सिग्नेचर वेरीफाईड कॉपी डाउनलोड करें — बिल्कुल मुफ्त, बिना Adobe, 
मोबाइल पर भी काम करता है।">

Page H1: "आधार PDF में Green Tick पाएं — मुफ्त, बिना Adobe"
Page intro paragraph in Hindi explaining the problem and solution.
The tool UI can be shared (same React component), just the surrounding 
text content and meta tags change.

This page will rank for:
- "आधार सिग्नेचर वेरीफाई कैसे करें"
- "आधार ग्रीन टिक ऑनलाइन"  
- "aadhar signature verify kaise kare"
- "आधार PDF हरा टिक"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After implementing, confirm each item:

[ ] <title> tag contains primary keywords
[ ] <meta description> is 150-160 chars and includes the problem + solution
[ ] All 3 JSON-LD schemas are valid (test at schema.org/validator)
[ ] FAQs render as visible text on the page
[ ] H1 contains "Aadhaar Signature" and "Green Tick" or "Verified"
[ ] H2 headings cover: why it happens, how it works, where it's needed, FAQ
[ ] /sitemap.xml is accessible and includes all URLs
[ ] /robots.txt allows all crawlers and references sitemap
[ ] og:image is 1200x630px and loads correctly
[ ] Page loads in under 3 seconds on mobile (test with PageSpeed Insights)
[ ] JS libraries load lazily (not blocking initial render)
[ ] Hindi page exists at /hi/ with localised meta tags
[ ] Google Search Console property is set up and sitemap submitted
[ ] No console errors or mixed content warnings