These browser assets are served from this application's origin. Document bytes
are processed on the teacher's device; no external OCR API is used.

Run `node scripts/build-worksheet-vendor.cjs` after `npm ci` to refresh pinned
Tesseract.js, PDF.js and Mammoth assets. Keep the accompanying licenses.

Vietnamese language data is from
https://github.com/tesseract-ocr/tessdata_fast/raw/main/vie.traineddata
(Apache 2.0). SHA256:
79df64caf7bcfb2a27df5042ecb6121e196eada34da774956995747636d5bfa1.
The language file is kept locally in `lang/vie.traineddata`; runtime does not
download it from a third-party server.

OCR is an editable draft, not an exact transcription guarantee. Color filtering
can remove printed colors; black handwriting needs manual masking. Cropped
illustrations must be reviewed for residual handwriting before saving/sharing.
