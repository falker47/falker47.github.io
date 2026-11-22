# URL map

P6 owns the redirect stubs and byte-identical legacy assets. Each stub sets the target canonical, refreshes immediately, and provides a visible target link. Its script uses `location.replace` and preserves the query and fragment, applying the fragment mappings below. A mapping that starts with `/` opens another page and keeps the query.

- /Nexus-portfolio/ and /Nexus-portfolio/index.html → / (hash map: #projects→/projects/, #certifications→#certificazioni, #contact→#contatti, #hero→none)
- /Nexus-portfolio/research.html → /research/ (#research-title→#main, #ringmin-title→#ringmin, #reproducibility-title→#riproducibilita)
- /Nexus-portfolio/prof-gecko.html → /projects/prof-gecko/ (#prof-gecko-title→#main, #prof-gecko-overview→#app, #prof-gecko-access-title→#risorse)
- /Nexus-portfolio/consigli.html → /uses/ (#recommendations-title→#main, #principles-title→#criterio)
- /Nexus-portfolio/testers.html → /projects/social-viewer/test/ (#page-title→#main, #returning and #first-time stay the same)
- /Nexus-portfolio/socialviewer-privacy.html → /projects/social-viewer/privacy/
- Byte-identical files at their old paths: /Nexus-portfolio/assets/profile/maurizio-falconi-falker47.webp, /Nexus-portfolio/assets/branding/falkerlogo.png and falkerlogo.webp, /Nexus-portfolio/assets/socialviewer/testers-preview.webp, /Nexus-portfolio/assets/projects/*.webp, /Nexus-portfolio/assets/certifications/*-full.webp and *-thumb.webp
- Retired project pages under /Nexus-portfolio/projects/ reach the custom 404, which recovers to /projects/.
- Unchanged: /, /?lang=it|en, /robots.txt, /sitemap.xml, raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json
