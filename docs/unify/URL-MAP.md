# URL map

P6 owns the redirect stubs and byte-identical legacy assets. Each stub sets the target canonical, refreshes immediately, and provides a visible target link. Its script uses `location.replace` and preserves the query and fragment, applying the home fragment mappings below.

- /Nexus-portfolio/ and /Nexus-portfolio/index.html → / (hash map: #projects→#progetti, #certifications→#certificazioni, #contact→#contatti, #hero→none)
- /Nexus-portfolio/research.html → /research/
- /Nexus-portfolio/prof-gecko.html → /projects/prof-gecko/
- /Nexus-portfolio/consigli.html → /uses/
- /Nexus-portfolio/testers.html → /projects/social-viewer/test/
- /Nexus-portfolio/socialviewer-privacy.html → /projects/social-viewer/privacy/
- Byte-identical files at their old paths: /Nexus-portfolio/assets/profile/maurizio-falconi-falker47.webp, /Nexus-portfolio/assets/branding/falkerlogo.png and falkerlogo.webp, /Nexus-portfolio/assets/socialviewer/testers-preview.webp, /Nexus-portfolio/assets/projects/*.webp, /Nexus-portfolio/assets/certifications/*-full.webp and *-thumb.webp
- Unchanged: /, /?lang=it|en, /robots.txt, /sitemap.xml, raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json
