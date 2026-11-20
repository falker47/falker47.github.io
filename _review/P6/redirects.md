# Legacy URLs in Chromium

Paths below share the loopback origin. The server served the published files with normal scripts and automatic refresh. The native-refresh row used a JavaScript-disabled context. A 404 at a mapped destination is expected until P2 or P3 declares the route.

| Old URL | First HTTP | Final URL reached | Final HTTP | Mechanism |
| --- | ---: | --- | ---: | --- |
| `/Nexus-portfolio/` | 200 | `/?lang=it` | 200 | location.replace |
| `/Nexus-portfolio/index.html` | 200 | `/?lang=it` | 200 | location.replace |
| `/Nexus-portfolio/research.html` | 200 | `/research/?lang=it` | 404 | location.replace |
| `/Nexus-portfolio/prof-gecko.html` | 200 | `/projects/prof-gecko/?lang=it` | 404 | location.replace |
| `/Nexus-portfolio/consigli.html` | 200 | `/uses/?lang=it` | 404 | location.replace |
| `/Nexus-portfolio/testers.html` | 200 | `/projects/social-viewer/test/?lang=it` | 404 | location.replace |
| `/Nexus-portfolio/socialviewer-privacy.html` | 200 | `/projects/social-viewer/privacy/?lang=it` | 404 | location.replace |
| `/Nexus-portfolio/index.html?lang=en&ref=a%2Bb#projects` | 200 | `/?lang=en&ref=a%2Bb#progetti` | 200 | location.replace |
| `/Nexus-portfolio/index.html?lang=en&ref=a%2Bb#certifications` | 200 | `/?lang=en&ref=a%2Bb#certificazioni` | 200 | location.replace |
| `/Nexus-portfolio/index.html?lang=en&ref=a%2Bb#contact` | 200 | `/?lang=en&ref=a%2Bb#contatti` | 200 | location.replace |
| `/Nexus-portfolio/index.html?lang=en&ref=a%2Bb#hero` | 200 | `/?lang=en&ref=a%2Bb` | 200 | location.replace |
| `/Nexus-portfolio/research.html?lang=en#paper` | 200 | `/research/?lang=en#paper` | 404 | location.replace |
| `/Nexus-portfolio/research.html` | 200 | `/research/` | 404 | Native meta refresh, JavaScript disabled |
| `/Nexus-portfolio/projects/retired.html?lang=en` | 404 | `/?lang=en#software` | 200 | 404 recovery |
| `/Nexus-portfolio/missing.html?lang=en` | 404 | `/?lang=en` | 200 | 404 recovery |
| `/missing-p6-page?lang=en` | 404 | `/missing-p6-page?lang=en` | 404 | Custom 404, URL retained |
| `/Nexus-portfolio/assets/branding/falkerlogo.png` | 200 | `/Nexus-portfolio/assets/branding/falkerlogo.png` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/branding/falkerlogo.webp` | 200 | `/Nexus-portfolio/assets/branding/falkerlogo.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Attestato Blazar Maurizio Falconi 2200x1700-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Attestato Blazar Maurizio Falconi 2200x1700-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Attestato Blazar Maurizio Falconi 2200x1700-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Attestato Blazar Maurizio Falconi 2200x1700-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Cert Microsoft AI & ML DR1IFS0JOA2H-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Cert Microsoft AI & ML DR1IFS0JOA2H-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Cert Microsoft AI & ML DR1IFS0JOA2H-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Cert Microsoft AI & ML DR1IFS0JOA2H-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Cert-5-ED-Master-Z-MAURIZIO-FALCONI 3300x2550-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Cert-5-ED-Master-Z-MAURIZIO-FALCONI 3300x2550-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Cert-5-ED-Master-Z-MAURIZIO-FALCONI 3300x2550-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Cert-5-ED-Master-Z-MAURIZIO-FALCONI 3300x2550-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate Advanced English Coursera 7PGZG57X3H9R-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate Advanced English Coursera 7PGZG57X3H9R-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate Advanced English Coursera 7PGZG57X3H9R-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate Advanced English Coursera 7PGZG57X3H9R-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate Google Cybersecurity Coursera 35X5VFX574YU-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate Google Cybersecurity Coursera 35X5VFX574YU-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate Google Cybersecurity Coursera 35X5VFX574YU-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate Google Cybersecurity Coursera 35X5VFX574YU-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate IBM Data Science Coursera UAD9R68X3KPX-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate IBM Data Science Coursera UAD9R68X3KPX-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate IBM Data Science Coursera UAD9R68X3KPX-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate IBM Data Science Coursera UAD9R68X3KPX-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate-Data-Structures-and-Algorithms-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate-Data-Structures-and-Algorithms-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate-Data-Structures-and-Algorithms-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate-Data-Structures-and-Algorithms-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate-Fintech-Spec-P6-DZAVHWT3-U4-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate-Fintech-Spec-P6-DZAVHWT3-U4-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate-Fintech-Spec-P6-DZAVHWT3-U4-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate-Fintech-Spec-P6-DZAVHWT3-U4-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate_SAS-1-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate_SAS-1-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Certificate_SAS-1-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Certificate_SAS-1-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Coursera archaeoastronomy LMKD4242VB7D-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Coursera archaeoastronomy LMKD4242VB7D-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Coursera archaeoastronomy LMKD4242VB7D-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Coursera archaeoastronomy LMKD4242VB7D-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/French-Certif-B2-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/French-Certif-B2-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/French-Certif-B2-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/French-Certif-B2-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Masterz-Spec 3300x2550-full.webp` | 200 | `/Nexus-portfolio/assets/certifications/Masterz-Spec 3300x2550-full.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/certifications/Masterz-Spec 3300x2550-thumb.webp` | 200 | `/Nexus-portfolio/assets/certifications/Masterz-Spec 3300x2550-thumb.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/profile/maurizio-falconi-falker47.webp` | 200 | `/Nexus-portfolio/assets/profile/maurizio-falconi-falker47.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/HLSE.webp` | 200 | `/Nexus-portfolio/assets/projects/HLSE.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/PMD.webp` | 200 | `/Nexus-portfolio/assets/projects/PMD.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/camaleonte-3-2-ratio.webp` | 200 | `/Nexus-portfolio/assets/projects/camaleonte-3-2-ratio.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/chilhadetto.webp` | 200 | `/Nexus-portfolio/assets/projects/chilhadetto.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/codice-fiscale.webp` | 200 | `/Nexus-portfolio/assets/projects/codice-fiscale.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/crack-the-code.webp` | 200 | `/Nexus-portfolio/assets/projects/crack-the-code.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/csu_preview.webp` | 200 | `/Nexus-portfolio/assets/projects/csu_preview.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/diario-di-bordo-preview.webp` | 200 | `/Nexus-portfolio/assets/projects/diario-di-bordo-preview.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/easycontract.webp` | 200 | `/Nexus-portfolio/assets/projects/easycontract.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/iban-checker.webp` | 200 | `/Nexus-portfolio/assets/projects/iban-checker.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/panacea.webp` | 200 | `/Nexus-portfolio/assets/projects/panacea.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/prof-gecko.webp` | 200 | `/Nexus-portfolio/assets/projects/prof-gecko.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/ringmin.webp` | 200 | `/Nexus-portfolio/assets/projects/ringmin.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/sommatrix.webp` | 200 | `/Nexus-portfolio/assets/projects/sommatrix.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/projects/zerofilez.webp` | 200 | `/Nexus-portfolio/assets/projects/zerofilez.webp` | 200 | SHA-256 matches the original |
| `/Nexus-portfolio/assets/socialviewer/testers-preview.webp` | 200 | `/Nexus-portfolio/assets/socialviewer/testers-preview.webp` | 200 | SHA-256 matches the original |
